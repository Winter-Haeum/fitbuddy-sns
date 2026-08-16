package io.github.winterhaeum.fitbuddy

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
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.ZoneId

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
 */
@CapacitorPlugin(name = "DailySteps")
class DailyStepsPlugin : Plugin() {

    private val pluginScope = CoroutineScope(Dispatchers.Main)
    private val readStepsPermission = HealthPermission.getReadPermission(StepsRecord::class)

    private var pendingPermissionCall: PluginCall? = null
    private lateinit var permissionLauncher: ActivityResultLauncher<Set<String>>

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
                val now = java.time.Instant.now()

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
