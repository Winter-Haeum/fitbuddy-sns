package io.github.winterhaeum.fitbuddy

import android.Manifest
import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.ext.SdkExtensions
import androidx.activity.result.ActivityResultLauncher
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

private const val ACTIVITY_RECOGNITION_ALIAS = "activityRecognition"

// foreground에서 열어두고 있을 때 Health Connect와 재동기화하는 주기. 실시간 반응 자체는 센서가
// 담당하므로 이 값은 어디까지나 "보정" 목적이며 짧게 잡을 필요가 없다.
private const val RECONCILE_INTERVAL_MS = 60_000L

/**
 * "오늘의 걸음" 기능 전용 Capacitor plugin.
 *
 * FitBuddy는 걸음을 직접 측정/기록하지 않는다. Android Health Connect가 이미 보유한
 * 오늘(로컬 자정~현재) 누적 걸음 수를 READ_STEPS 권한으로 읽어 그대로 화면에 보여줄 뿐이다.
 * WRITE_STEPS 등 다른 건강 데이터 권한은 요청하지 않는다.
 *
 * Health Connect 앱 자체를 쓸 수 있는지(getSdkStatus)와, 그 위에서 "휴대폰 자체 자동 걸음
 * 측정"(on-device step counting)을 쓸 수 있는지는 서로 다른 조건이다. 후자는 공식 문서 기준
 * Android 14(API 34)+ 와 SDK Extension 20+ 를 모두 만족해야 하며, 둘 중 하나라도 미달이면
 * Health Connect 자체는 정상이어도 자동 걸음은 지원 불가로 처리하고 0을 정상 값처럼
 * 반환하지 않는다.
 *
 * ── foreground 실시간 보정(live steps) ──────────────────────────────────────
 * Health Connect의 오늘 누적값은 "하루 전체 걸음 수의 source of truth"로 계속 유지하되,
 * FitBuddy가 실제로 화면에 떠 있는(foreground) 동안에는 Sensor.TYPE_STEP_DETECTOR(없으면
 * TYPE_STEP_COUNTER)로 걸음을 즉시 감지해 UI를 빠르게 증가시킨다. 이 센서 값은 별도의
 * 두 번째 만보기가 아니라 "Health Connect가 아직 반영하지 못한 최근 걸음"을 임시로 보여주는
 * delta일 뿐이며, Health Connect가 그 걸음을 반영하는 순간 새 기준점으로 대체되어(rebase)
 * 이중 카운트를 방지한다. FitBuddy가 background/종료 상태일 때는 이 센서를 전혀 사용하지
 * 않고 Health Connect가 하루 전체를 담당한다(foreground service/WorkManager 등 상시 실행
 * 없음).
 */
@CapacitorPlugin(
    name = "DailySteps",
    permissions = [
        Permission(strings = [Manifest.permission.ACTIVITY_RECOGNITION], alias = ACTIVITY_RECOGNITION_ALIAS),
    ]
)
class DailyStepsPlugin : Plugin(), SensorEventListener {

    private val pluginScope = CoroutineScope(Dispatchers.Main)
    private val readStepsPermission = HealthPermission.getReadPermission(StepsRecord::class)

    private var pendingPermissionCall: PluginCall? = null
    private lateinit var permissionLauncher: ActivityResultLauncher<Set<String>>

    // ── live session 상태(모두 메인 스레드에서만 접근: 센서 콜백과 reconciliation 코루틴
    // 둘 다 Dispatchers.Main 기준으로 실행되므로 별도 동기화가 필요 없다) ──
    private val sensorManager: SensorManager by lazy {
        activity.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    }
    private var activeSensor: Sensor? = null
    private var usingStepDetector = false
    private var counterBaselineRaw: Float? = null // TYPE_STEP_COUNTER fallback 전용 기준점
    private var sessionHealthBase = 0L
    private var sessionLiveDelta = 0L
    private var lastDisplayedTotal = 0L
    private var sessionDateLocal: String = ""
    private var liveSessionActive = false
    private var reconciliationJob: Job? = null

    // ActivityResultLauncher는 Activity가 STARTED 상태가 되기 전(=load() 시점, onCreate 중)에
    // 등록해야 하므로 여기서 미리 등록해 둔다.
    override fun load() {
        super.load()
        permissionLauncher = activity.registerForActivityResult(
            PermissionController.createRequestPermissionResultContract()
        ) { granted ->
            val call = pendingPermissionCall
            pendingPermissionCall = null
            val result = JSObject()
            result.put("granted", granted.contains(readStepsPermission))
            call?.resolve(result)
        }
    }

    /** Health Connect를 이 기기에서 사용할 수 있는지 확인한다. */
    @PluginMethod
    fun getAvailability(call: PluginCall) {
        val result = JSObject()
        result.put("status", availabilityStatus())
        call.resolve(result)
    }

    /** READ_STEPS 권한이 이미 허용되어 있는지 확인한다. */
    @PluginMethod
    fun hasPermission(call: PluginCall) {
        if (availabilityStatus() != "available") {
            call.resolve(JSObject().put("granted", false))
            return
        }
        val client = HealthConnectClient.getOrCreate(context)
        pluginScope.launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                call.resolve(JSObject().put("granted", granted.contains(readStepsPermission)))
            } catch (e: Exception) {
                call.reject("failed to check Health Connect permission", e)
            }
        }
    }

    /** READ_STEPS 권한을 요청한다(사용자 동작으로 호출되어야 함). */
    @PluginMethod
    fun requestPermission(call: PluginCall) {
        val status = availabilityStatus()
        if (status != "available") {
            call.reject(status)
            return
        }
        pendingPermissionCall = call
        permissionLauncher.launch(setOf(readStepsPermission))
    }

    /** 오늘 00:00(기기 로컬 시간)부터 현재까지의 누적 걸음 수를 Health Connect에서 읽는다. */
    @PluginMethod
    fun getTodaySteps(call: PluginCall) {
        val status = availabilityStatus()
        if (status != "available") {
            // step_tracking_unsupported든 unavailable/update_required든, 자동 걸음을 보장할 수
            // 없는 상태에서는 절대 0을 정상 값처럼 반환하지 않는다.
            call.reject(status)
            return
        }
        val client = HealthConnectClient.getOrCreate(context)
        pluginScope.launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                if (!granted.contains(readStepsPermission)) {
                    call.reject("permission_denied")
                    return@launch
                }

                val zone = ZoneId.systemDefault()
                val startOfToday = LocalDate.now(zone).atStartOfDay(zone).toInstant()
                val now = Instant.now()

                val response = client.aggregate(
                    AggregateRequest(
                        metrics = setOf(StepsRecord.COUNT_TOTAL),
                        timeRangeFilter = TimeRangeFilter.between(startOfToday, now)
                    )
                )
                val steps = response[StepsRecord.COUNT_TOTAL] ?: 0L

                val result = JSObject()
                result.put("steps", steps)
                call.resolve(result)
            } catch (e: Exception) {
                call.reject("failed to read today's steps from Health Connect", e)
            }
        }
    }

    /** ACTIVITY_RECOGNITION 런타임 권한이 이미 허용되어 있는지 확인한다(API 29 미만은 항상 true). */
    @PluginMethod
    fun hasActivityRecognitionPermission(call: PluginCall) {
        call.resolve(JSObject().put("granted", isActivityRecognitionGranted()))
    }

    /**
     * ACTIVITY_RECOGNITION 런타임 권한을 요청한다(API 29 미만은 요청 없이 즉시 granted).
     * Capacitor의 공식 permission API(@CapacitorPlugin permissions + requestPermissionForAlias)를
     * 사용하며, Health Connect READ_STEPS와는 완전히 별개의 독립된 요청이다.
     */
    @PluginMethod
    fun requestActivityRecognitionPermission(call: PluginCall) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.resolve(JSObject().put("granted", true))
            return
        }
        if (getPermissionState(ACTIVITY_RECOGNITION_ALIAS) == PermissionState.GRANTED) {
            call.resolve(JSObject().put("granted", true))
            return
        }
        requestPermissionForAlias(ACTIVITY_RECOGNITION_ALIAS, call, "activityRecognitionPermCallback")
    }

    @PermissionCallback
    private fun activityRecognitionPermCallback(call: PluginCall) {
        call.resolve(JSObject().put("granted", isActivityRecognitionGranted()))
    }

    /**
     * foreground 실시간 걸음 보정 세션을 시작한다.
     *
     * Health Connect READ_STEPS가 없으면(baseline을 읽을 수 없으므로) 시작하지 않고
     * `started:false`로 안전하게 응답한다 — 이 경우에도 기존 getTodaySteps 기반 흐름은
     * 전혀 영향을 받지 않는다. ACTIVITY_RECOGNITION이 없거나 걸음 센서가 없는 기기에서도
     * 마찬가지로 실시간 기능만 비활성화될 뿐 앱이 깨지지 않는다.
     */
    @PluginMethod
    fun startLiveSteps(call: PluginCall) {
        pluginScope.launch {
            try {
                if (availabilityStatus() != "available") {
                    call.resolve(JSObject().put("started", false).put("reason", "health_connect_unavailable"))
                    return@launch
                }

                val client = HealthConnectClient.getOrCreate(context)
                val granted = client.permissionController.getGrantedPermissions()
                if (!granted.contains(readStepsPermission)) {
                    call.resolve(JSObject().put("started", false).put("reason", "permission_denied"))
                    return@launch
                }

                if (!isActivityRecognitionGranted()) {
                    call.resolve(JSObject().put("started", false).put("reason", "activity_recognition_denied"))
                    return@launch
                }

                val sensor = pickStepSensor()
                if (sensor == null) {
                    call.resolve(JSObject().put("started", false).put("reason", "sensor_unavailable"))
                    return@launch
                }

                val baseline = queryTodayStepsFromHealthConnect(client)
                if (baseline == null) {
                    call.resolve(JSObject().put("started", false).put("reason", "permission_denied"))
                    return@launch
                }

                // 재시작 시 항상 먼저 완전히 정리한 뒤 새 세션을 연다 — 중복 리스너 등록/누적 방지.
                stopLiveSession()

                val today = todayLocalDateString()
                // background로 내려갔다가 foreground로 복귀하는 경우, 직전 세션에서 이미
                // 사용자에게 보여준 값(lastDisplayedTotal)이 방금 새로 읽은 Health Connect
                // baseline보다 클 수 있다(HC가 그 걸음들을 아직 반영하지 못한 상태). 같은
                // 로컬 날짜 안에서는 화면 숫자가 뒤로 감소하면 안 되므로 그 값을 새 기준점의
                // 하한으로 carry-forward한다. 날짜가 바뀌었거나 이번이 최초 세션(프로세스
                // 재시작 등으로 lastDisplayedTotal/sessionDateLocal이 초기값)이면 순수하게
                // baseline에서 새로 시작한다.
                val carriedDisplay = if (sessionDateLocal == today) lastDisplayedTotal else 0L
                val newBase = maxOf(baseline, carriedDisplay)

                activeSensor = sensor
                usingStepDetector = sensor.type == Sensor.TYPE_STEP_DETECTOR
                counterBaselineRaw = null
                sessionHealthBase = newBase
                sessionLiveDelta = 0L
                lastDisplayedTotal = newBase
                sessionDateLocal = today
                liveSessionActive = true

                sensorManager.registerListener(this@DailyStepsPlugin, sensor, SensorManager.SENSOR_DELAY_UI)
                startReconciliationLoop()

                call.resolve(JSObject().put("started", true).put("steps", lastDisplayedTotal))
            } catch (e: Exception) {
                call.resolve(JSObject().put("started", false).put("reason", "error"))
            }
        }
    }

    /** foreground 실시간 보정 세션을 종료한다(센서 리스너 해제, 주기 보정 중단). */
    @PluginMethod
    fun stopLiveSteps(call: PluginCall) {
        stopLiveSession()
        call.resolve(JSObject().put("stopped", true))
    }

    private fun stopLiveSession() {
        if (activeSensor != null) {
            sensorManager.unregisterListener(this)
        }
        activeSensor = null
        counterBaselineRaw = null
        reconciliationJob?.cancel()
        reconciliationJob = null
        liveSessionActive = false
    }

    // Activity가 완전히 종료될 때의 최종 안전망. background 전환 시의 정상 정리는 JS 쪽
    // appStateChange 리스너가 stopLiveSteps()를 명시적으로 호출하는 흐름을 그대로 사용한다.
    override fun handleOnDestroy() {
        stopLiveSession()
        super.handleOnDestroy()
    }

    // ── SensorEventListener ──────────────────────────────────────────────

    override fun onSensorChanged(event: SensorEvent?) {
        if (event == null || !liveSessionActive) return

        // 자정을 넘긴 뒤 첫 걸음이라면, 다음 reconciliation을 기다리지 않고 즉시 새 하루로
        // 초기화한다(정확한 Health Connect 기준값은 곧이어 도는 reconciliation이 채워준다).
        val today = todayLocalDateString()
        if (today != sessionDateLocal) {
            sessionDateLocal = today
            sessionHealthBase = 0L
            sessionLiveDelta = 0L
            counterBaselineRaw = null
            lastDisplayedTotal = 0L
        }

        if (usingStepDetector) {
            // TYPE_STEP_DETECTOR: 이벤트 1회 = 걸음 1회(values[0]는 항상 1.0).
            sessionLiveDelta += 1
        } else {
            // TYPE_STEP_COUNTER: 기기 부팅 이후 누적값. 리스너 등록 후 처음 들어온 값을
            // 기준점으로 잡고, 그 이후 증가분만 delta로 사용한다(전체 값을 그대로 쓰지 않는다).
            val raw = event.values.getOrNull(0) ?: return
            val base = counterBaselineRaw
            if (base == null) {
                counterBaselineRaw = raw
                return
            }
            sessionLiveDelta = (raw - base).toLong().coerceAtLeast(0L)
        }

        val candidate = sessionHealthBase + sessionLiveDelta
        if (candidate > lastDisplayedTotal) {
            lastDisplayedTotal = candidate
            emitSteps(lastDisplayedTotal)
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    // ── Health Connect reconciliation ────────────────────────────────────

    private fun startReconciliationLoop() {
        reconciliationJob = pluginScope.launch {
            while (liveSessionActive) {
                delay(RECONCILE_INTERVAL_MS)
                if (!liveSessionActive) break
                reconcileWithHealthConnect()
            }
        }
    }

    /**
     * Health Connect의 오늘 누적값을 다시 읽어 live delta와 안전하게 재조정한다.
     *
     * - latest(HC 최신값)가 sessionHealthBase+sessionLiveDelta 이상이면, HC가 지금까지의
     *   live 걸음을 이미(또는 그 이상, 다른 소스 포함) 반영했다는 뜻이므로 그 값을 새
     *   기준점으로 삼고 delta를 0으로 되돌린다 — 다음 걸음이 이미 반영된 값 위에 또
     *   더해지는 이중 카운트를 막는다.
     * - latest가 더 작으면 HC 반영이 아직 지연된 것뿐이므로 기준점을 건드리지 않고,
     *   화면에 이미 보여준 값보다 낮아지지도 않게 한다(같은 날짜 안에서 숫자 역행 금지).
     */
    private suspend fun reconcileWithHealthConnect() {
        val today = todayLocalDateString()
        if (today != sessionDateLocal) {
            val fresh = queryTodayStepsFromHealthConnect() ?: 0L
            sessionDateLocal = today
            sessionHealthBase = fresh
            sessionLiveDelta = 0L
            counterBaselineRaw = null
            lastDisplayedTotal = fresh
            emitSteps(lastDisplayedTotal)
            return
        }

        val latest = queryTodayStepsFromHealthConnect() ?: return
        val candidate = sessionHealthBase + sessionLiveDelta

        if (latest >= candidate) {
            sessionHealthBase = latest
            sessionLiveDelta = 0L
            counterBaselineRaw = null
        }

        val display = maxOf(latest, sessionHealthBase + sessionLiveDelta, lastDisplayedTotal)
        if (display != lastDisplayedTotal) {
            lastDisplayedTotal = display
            emitSteps(lastDisplayedTotal)
        }
    }

    private suspend fun queryTodayStepsFromHealthConnect(
        client: HealthConnectClient = HealthConnectClient.getOrCreate(context)
    ): Long? {
        val granted = client.permissionController.getGrantedPermissions()
        if (!granted.contains(readStepsPermission)) return null

        val zone = ZoneId.systemDefault()
        val startOfToday = LocalDate.now(zone).atStartOfDay(zone).toInstant()
        val now = Instant.now()
        val response = client.aggregate(
            AggregateRequest(
                metrics = setOf(StepsRecord.COUNT_TOTAL),
                timeRangeFilter = TimeRangeFilter.between(startOfToday, now)
            )
        )
        return response[StepsRecord.COUNT_TOTAL] ?: 0L
    }

    private fun emitSteps(steps: Long) {
        notifyListeners("stepsUpdate", JSObject().put("steps", steps))
    }

    /** 1순위 TYPE_STEP_DETECTOR(걸음마다 이벤트), 없으면 TYPE_STEP_COUNTER로 fallback. 둘 다 없으면 null. */
    private fun pickStepSensor(): Sensor? {
        sensorManager.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR)?.let { return it }
        return sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
    }

    private fun isActivityRecognitionGranted(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return true
        return getPermissionState(ACTIVITY_RECOGNITION_ALIAS) == PermissionState.GRANTED
    }

    private fun todayLocalDateString(): String = LocalDate.now(ZoneId.systemDefault()).toString()

    /**
     * "available" | "update_required" | "step_tracking_unsupported" | "unavailable"
     *
     * getSdkStatus()는 Health Connect 자체의 사용 가능 여부만 알려줄 뿐, 그 위의 on-device
     * 자동 걸음 측정 기능을 보장하지 않는다. 두 조건을 모두 만족해야 "available"이다.
     */
    private fun availabilityStatus(): String {
        return when (HealthConnectClient.getSdkStatus(context)) {
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "update_required"
            HealthConnectClient.SDK_AVAILABLE ->
                if (isOnDeviceStepTrackingSupported()) "available" else "step_tracking_unsupported"
            else -> "unavailable"
        }
    }

    /**
     * 공식 문서 기준 on-device step counting 지원 조건: Android 14(API 34, UPSIDE_DOWN_CAKE)
     * 이상이면서 SDK Extension(UPSIDE_DOWN_CAKE 확장) 버전이 20 이상이어야 한다.
     * https://developer.android.com/health-and-fitness/health-connect/features/steps
     */
    private fun isOnDeviceStepTrackingSupported(): Boolean {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE &&
            SdkExtensions.getExtensionVersion(Build.VERSION_CODES.UPSIDE_DOWN_CAKE) >= 20
    }
}
