import { JobDetailResult } from "./types";
import { DroneState, WaylineAreaState, DroneMappingState } from "./job-state";

// 将API返回的无人机数据转换为前端状态格式
export function formatDronesData(
  drones: JobDetailResult["drones"] | undefined
): DroneState[] {
  if (!drones) return [];

  return drones.map((drone) => ({
    key: drone.key,
    index: drone.index,
    id: drone.id,
    name: drone.name,
    description: drone.description,
    model: drone.model,
    color: drone.color,
    variantion: drone.variantion,
  }));
}

// 将API返回的映射数据转换为前端状态格式
export function formatMappingsData(
  mappings: JobDetailResult["mappings"] | undefined
): DroneMappingState[] {
  if (!mappings) return [];

  return mappings.map((mapping) => ({
    selected_drone_key: mapping.selected_drone_key,
    physical_drone_id: mapping.physical_drone_id,
    lens_type: "visible" as const, // 默认为可见光类型
  }));
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
    path: wayline.path.map((p) => new AMap.LngLat(p.lng, p.lat)),
    points: wayline.points?.map((p) => new AMap.LngLat(p.lng, p.lat)),
    visible: true,
    // 添加可能的云台参数
    gimbalPitch: wayline.points?.[0]?.gimbal_pitch || -90,
    gimbalZoom: wayline.points?.[0]?.gimbal_zoom || 1,
  }));
}

// 准备提交数据的格式化函数
export function prepareSubmitData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: any, // 表单数据
  state: {
    selectedDrones: DroneState[];
    waylineAreas: WaylineAreaState[];
    droneMappings: DroneMappingState[];
  }
) {
  const { selectedDrones, waylineAreas, droneMappings } = state;

  return {
    name: formData.name || "",
    description: formData.description,
    area_id: formData.area_id || 0,
    schedule_time: formData.schedule_time,
    drones: selectedDrones.map((drone) => ({
      index: drone.index || 0,
      key: drone.key,
      model_id: drone.id,
      variantion_id: drone.variantion.id,
      color: drone.color,
    })),
    waylines: waylineAreas.map((wayline) => ({
      drone_key: wayline.droneKey,
      height: 0,
      color: wayline.color,
      path: wayline.path.map((p) => ({
        lat: p.getLat(),
        lng: p.getLng(),
      })),
      points: wayline.points?.map((p, idx) => ({
        index: idx,
        lat: p.getLat(),
        lng: p.getLng(),
        // 添加云台参数
        gimbal_pitch: wayline.gimbalPitch || -90, // 默认值 -90 度（垂直向下）
        gimbal_zoom: wayline.gimbalZoom || 1, // 默认放大倍数 1x
      })),
    })),
    mappings: droneMappings.map((mapping) => ({
      selected_drone_key: mapping.selected_drone_key,
      physical_drone_id: mapping.physical_drone_id,
    })),
  };
}

// 验证提交数据
export function validateJobData(
  selectedDrones: DroneState[],
  waylineAreas: WaylineAreaState[],
  droneMappings: DroneMappingState[]
): { isValid: boolean; errorMessage?: string } {
  // 检查是否有选择无人机
  if (!selectedDrones || selectedDrones.length <= 0) {
    return { isValid: false, errorMessage: "请至少选择一台无人机" };
  }

  // 检查是否有航线
  if (!waylineAreas || waylineAreas.length <= 0) {
    return { isValid: false, errorMessage: "请至少选择一条航线" };
  }

  // 检查是否有映射关系
  if (!droneMappings || droneMappings.length <= 0) {
    return { isValid: false, errorMessage: "请至少选择一台实际无人机" };
  }

  // 检查映射关系是否完整
  const invalidMappings = droneMappings.filter(
    (mapping) => mapping.physical_drone_id <= 0
  );
  if (invalidMappings.length > 0) {
    return {
      isValid: false,
      errorMessage: "存在未绑定物理无人机的机型，请完成所有无人机的绑定",
    };
  }

  return { isValid: true };
}
