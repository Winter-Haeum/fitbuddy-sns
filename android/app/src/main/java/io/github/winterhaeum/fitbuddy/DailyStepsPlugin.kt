package io.github.winterhaeum.fitbuddy

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
        if (availabilityStatus() != "available") {
            call.reject("health_connect_unavailable")
            return
        }
        pendingPermissionCall = call
        permissionLauncher.launch(setOf(readStepsPermission))
    }

    /** 오늘 00:00(기기 로컬 시간)부터 현재까지의 누적 걸음 수를 Health Connect에서 읽는다. */
    @PluginMethod
    fun getTodaySteps(call: PluginCall) {
        if (availabilityStatus() != "available") {
            call.reject("health_connect_unavailable")
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

    /** "available" | "update_required" | "unavailable" */
    private fun availabilityStatus(): String {
        return when (HealthConnectClient.getSdkStatus(context)) {
            HealthConnectClient.SDK_AVAILABLE -> "available"
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "update_required"
            else -> "unavailable"
        }
    }
}
