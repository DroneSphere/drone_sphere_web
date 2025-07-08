import {
  JobCreationOptions,
  JobCreationRequest,
  JobDetailResult,
  WaylineGenerationParams,
} from "./types";
import {
  WaylineAreaState,
  CommandDroneState,
  DroneStateV2,
  JobState,
  WaylineParamsState,
} from "./job-state";

export function formatWaylineParamsData(
  waylineParams: WaylineGenerationParams
): WaylineParamsState {
  return {
    flyingHeight: waylineParams.flying_height || 0,
    coverageWidth: -1,
    overlapRate: waylineParams.overlap_rate || 0,
    heightInterval: waylineParams.height_interval || 0,
    gimbalPitch: waylineParams.gimbal_pitch || 0,
    gimbalZoom: waylineParams.gimbal_zoom || 0,
  };
}

// 将API返回的无人机数据转换为前端状态格式
export function formatDronesData(
  drones: JobDetailResult["drones"] | undefined,
  droneModels: JobCreationOptions["drones"] | undefined
): DroneStateV2[] {
  if (!drones) return [];

  return drones.map((drone) => {
    const model = droneModels?.find((model) => model.id === drone.model_id);
    const variation = model?.variantions.find(
      (variation) => variation.id === drone.variation_id
    );
    return {
      key: drone.key,
      index: drone.index,
      model_id: drone.model_id,
      physical_drone_id: drone.physical_drone_id,
      physical_drone_sn: drone.physical_drone?.sn,
      physical_drone_callsign: drone.physical_drone?.callsign,
      name: model?.name || "",
      description: model?.description || "",
      color: drone.color || "",
      lens_type: drone.lens_type || "",
      variation: variation,
      takeoffPoint: drone.takeoff_point
        ? {
            lat: drone.takeoff_point.lat,
            lng: drone.takeoff_point.lng,
            altitude: drone.takeoff_point.altitude,
          }
        : undefined,
      wayline_name: drone?.wayline?.wayline_name || null,
      wayline_url: drone.wayline?.url || null,
      cameras: drone?.gimbal_model?.cameras
    } as DroneStateV2;
  });
}

// 将API返回的航线数据转换为前端状态格式
export function formatWaylinesData(
  waylines: JobDetailResult["waylines"] | undefined,
  AMap: typeof window.AMap | null
): WaylineAreaState[] {
  if (!waylines || !AMap) return [];

  return waylines.map((wayline) => ({
    droneKey: wayline.drone_key,
    color: wayline.color,
    altitude: wayline.altitude,
    path: wayline.path.map((p) => new AMap.LngLat(p.lng, p.lat)),
    waypoints: wayline.waypoints?.map((p) => new AMap.LngLat(p.lng, p.lat)),
    visible: true,
    // 添加可能的云台参数
    gimbalPitch: wayline.gimbal_pitch || -90,
    gimbalZoom: wayline.gimbal_zoom || 1,
  }));
}

export function formatCommandDronesData(
  commandDrones: JobDetailResult["command_drones"] | undefined
): CommandDroneState[] {
  if (!commandDrones) return [];

  return commandDrones.map((drone) => ({
    droneKey: drone.drone_key,
    color: drone.color,
    position: {
      lat: drone.position.lat,
      lng: drone.position.lng,
      altitude: drone.position.altitude,
    },
  }));
}

// 准备提交数据的格式化函数
export function prepareSubmitData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: any, // 表单数据
  state: JobState // 当前状态
): JobCreationRequest {
  const { drones, waylineAreas, commandDrones = [] } = state;

  // 基础提交数据
  const submitData: JobCreationRequest = {
    name: formData.name || "",
    description: formData.description,
    area_id: formData.area_id || 0,
    schedule_time: formData.schedule_time,
    drones: drones.map((drone) => ({
      index: drone.index || 0,
      key: drone.key,
      model_id: drone.model_id,
      variation_id: drone.variation.id,
      physical_drone_id: drone.physical_drone_id!,
      color: drone.color,
      lens_type: drone.lens_type,
      takeoff_point: {
        lat: drone.takeoffPoint?.lat || 0,
        lng: drone.takeoffPoint?.lng || 0,
        altitude: drone.takeoffPoint?.altitude || 0,
      },
    })),
    waylines: waylineAreas.map((wayline) => ({
      drone_key: wayline.droneKey,
      altitude: wayline.altitude,
      color: wayline.color,
      gimbal_pitch: wayline.gimbalPitch,
      gimbal_zoom: wayline.gimbalZoom,
      path: wayline.path.map((p) => ({
        lat: p.getLat(),
        lng: p.getLng(),
      })),
      waypoints: wayline.waypoints?.map((p, idx) => ({
        index: idx,
        lat: p.getLat(),
        lng: p.getLng(),
      })),
    })),
    wayline_generation_params: {
      flying_height: state.waylineParams.flyingHeight || 0,
      overlap_rate: state.waylineParams.overlapRate || 0,
      height_interval: state.waylineParams.heightInterval || 0,
      gimbal_pitch: state.waylineParams.gimbalPitch || 0,
      gimbal_zoom: state.waylineParams.gimbalZoom || 0,
    },
  };

  // 如果存在指挥机数据，添加到提交数据中
  if (commandDrones.length > 0) {
    return {
      ...submitData,
      // 添加指挥机数据
      command_drones: commandDrones.map((commandDrone) => ({
        drone_key: commandDrone.droneKey,
        position: {
          lat: commandDrone.position.lat,
          lng: commandDrone.position.lng,
          altitude: commandDrone.position.altitude,
        },
      })),
    };
  }

  return submitData;
}

// 验证提交数据
export function validateJobData(
  drones: DroneStateV2[],
  waylineAreas: WaylineAreaState[],
  commandDrones: CommandDroneState[] = [] // 添加可选的指挥机参数
): { isValid: boolean; errorMessage?: string } {
  // 检查是否有选择无人机
  if (!drones || drones.length <= 0) {
    return { isValid: false, errorMessage: "请至少选择一台无人机" };
  }

  // 检查是否有航线
  if (!waylineAreas || waylineAreas.length <= 0) {
    return { isValid: false, errorMessage: "请至少选择一条航线" };
  }

  // 验证指挥机数据
  if (commandDrones.length > 0) {
    // 获取无人机键值
    const droneKeys = drones.map((drone) => drone.key);

    // 检查所有指挥机是否都有对应的无人机
    const invalidCommandDrones = commandDrones.filter(
      (cd) => !droneKeys.includes(cd.droneKey)
    );

    if (invalidCommandDrones.length > 0) {
      return {
        isValid: false,
        errorMessage: "存在无效的指挥机配置，请检查指挥机与无人机的关联",
      };
    }

    // 确保同一架无人机不能既是指挥机又分配了航线任务
    const waylineDroneKeys = waylineAreas.map((wa) => wa.droneKey);
    const commandDroneKeys = commandDrones.map((cd) => cd.droneKey);

    // 查找同时存在于两个数组中的键值
    const duplicateDrones = commandDroneKeys.filter((key) =>
      waylineDroneKeys.includes(key)
    );

    if (duplicateDrones.length > 0) {
      return {
        isValid: false,
        errorMessage:
          "同一架无人机不能同时被分配为航线任务和指挥机，请重新分配",
      };
    }
  }

  return { isValid: true };
}
