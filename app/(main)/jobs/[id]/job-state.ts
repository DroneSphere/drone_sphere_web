import { JobDetailResult, JobDroneVariation } from "./types";

// 定义各种状态类型
export type DroneStateV2 = {
  /** 无人机唯一键, 格式：${index}-${model_id}-${variation_index} */
  key: string;
  /** 无人机索引（可选） */
  index?: number;
  /** 无人机型号ID */
  model_id: number;
  /** 无人机实例ID */
  physical_drone_id?: number;
  /** 无人机名称 */
  name: string;
  /** 无人机描述（可选） */
  description?: string;
  /** 无人机颜色 */
  color: string;
  lens_type?: string; // 镜头类型
  /** 无人机变体信息 */
  variation: JobDroneVariation;
};
export type DroneState = JobDetailResult["drones"][0];
export type WaylineAreaState = {
  droneKey: string;
  color: string;
  path: AMap.LngLat[];
  points?: AMap.LngLat[];
  visible?: boolean;
  gimbalPitch?: number; // 云台俯仰角参数，默认-90度（垂直向下）
  gimbalZoom?: number; // 云台放大倍数参数，默认1倍
};
export type DroneMappingState = {
  selected_drone_key: string;
  physical_drone_id: number;
  lens_type: "visible" | "thermal" | "zoom"; // 镜头类型
};

// 指挥机状态定义
export type CommandDroneState = {
  /** 关联到selectedDrones中的无人机唯一键 */
  drone_key: string;
  /** 指挥机目标位置 */
  position: {
    /** 纬度 */
    lat: number;
    /** 经度 */
    lng: number;
    /** 高度(米) */
    altitude: number;
  };
  /** 指挥机的显示颜色（从关联的无人机获取） */
  color: string;
};

// 统一的任务状态类型
export interface JobState {
  drones: DroneStateV2[];
  selectedDrones: DroneState[];
  waylineAreas: WaylineAreaState[];
  droneMappings: DroneMappingState[];
  path: AMap.LngLat[]; // 区域路径
  commandDrones: CommandDroneState[]; // 指挥机列表
}

// 定义所有可能的动作
export type JobAction =
  | { type: "SET_DRONES"; payload: DroneStateV2[] }
  | { type: "ADD_DRONE_V2"; payload: DroneStateV2 }
  | { type: "REMOVE_DRONE_V2"; payload: { key: string } }
  | { type: "UPDATE_DRONE_V2"; payload: DroneStateV2 }
  | { type: "SET_SELECTED_DRONES"; payload: DroneState[] }
  | { type: "SET_WAYLINE_AREAS"; payload: WaylineAreaState[] }
  | {
      type: "UPDATE_WAYLINE_AREA";
      payload: { index: number; wayline: Partial<WaylineAreaState> };
    }
  | { type: "SET_DRONE_MAPPINGS"; payload: DroneMappingState[] }
  | {
      type: "UPDATE_DRONE_MAPPING";
      payload: { key: string; mapping: Partial<DroneMappingState> };
    }
  | { type: "ADD_DRONE"; payload: DroneState }
  | { type: "REMOVE_DRONE"; payload: { key: string } }
  | { type: "SET_PATH"; payload: AMap.LngLat[] }
  | { type: "SET_COMMAND_DRONES"; payload: CommandDroneState[] }
  | { type: "ADD_COMMAND_DRONE"; payload: CommandDroneState }
  | { type: "REMOVE_COMMAND_DRONE"; payload: { drone_key: string } }
  | {
      type: "UPDATE_COMMAND_DRONE_POSITION";
      payload: {
        drone_key: string;
        position: { lat: number; lng: number; altitude: number };
      };
    }
  | { type: "RESET_STATE"; payload: Partial<JobState> };

// 创建初始状态
export const initialJobState: JobState = {
  drones: [],
  selectedDrones: [],
  waylineAreas: [],
  droneMappings: [],
  path: [],
  commandDrones: [], // 添加空的指挥机数组
};

// 创建reducer函数
export function jobReducer(state: JobState, action: JobAction): JobState {
  switch (action.type) {
    case "SET_DRONES":
      return {
        ...state,
        drones: action.payload,
      };
    case "ADD_DRONE_V2": {
      return {
        ...state,
        drones: [...state.drones, action.payload],
      };
    }
    case "UPDATE_DRONE_V2": {
      return {
        ...state,
        drones: state.drones.map((drone) =>
          drone.key === action.payload.key ? action.payload : drone
        ),
      };
    }
    case "REMOVE_DRONE_V2": {
      return {
        ...state,
        drones: state.drones.filter(
          (drone) => drone.key !== action.payload.key
        ),
      };
    }
    case "SET_SELECTED_DRONES":
      return {
        ...state,
        selectedDrones: action.payload,
      };
    case "SET_WAYLINE_AREAS":
      return {
        ...state,
        waylineAreas: action.payload,
      };
    case "UPDATE_WAYLINE_AREA":
      return {
        ...state,
        waylineAreas: state.waylineAreas.map((area, index) =>
          index === action.payload.index
            ? { ...area, ...action.payload.wayline }
            : area
        ),
      };
    case "SET_DRONE_MAPPINGS":
      return {
        ...state,
        droneMappings: action.payload,
      };
    case "UPDATE_DRONE_MAPPING":
      return {
        ...state,
        droneMappings: state.droneMappings.map((mapping) =>
          mapping.selected_drone_key === action.payload.key
            ? { ...mapping, ...action.payload.mapping }
            : mapping
        ),
      };
    case "ADD_DRONE": {
      // 添加无人机，并创建默认映射
      const newDrone = action.payload;
      const newMapping: DroneMappingState = {
        selected_drone_key: newDrone.key,
        physical_drone_id: 0,
        lens_type: "visible",
      };

      return {
        ...state,
        selectedDrones: [...state.selectedDrones, newDrone],
        droneMappings: [...state.droneMappings, newMapping],
      };
    }
    case "REMOVE_DRONE": {
      // 移除无人机及其相关的映射和航线
      const droneKey = action.payload.key;
      return {
        ...state,
        selectedDrones: state.selectedDrones.filter(
          (drone) => drone.key !== droneKey
        ),
        droneMappings: state.droneMappings.filter(
          (mapping) => mapping.selected_drone_key !== droneKey
        ),
        waylineAreas: state.waylineAreas.filter(
          (area) => area.droneKey !== droneKey
        ),
      };
    }
    case "SET_PATH":
      return {
        ...state,
        path: action.payload,
      };
    case "SET_COMMAND_DRONES":
      return {
        ...state,
        commandDrones: action.payload,
      };
    case "ADD_COMMAND_DRONE":
      // 确保同一个无人机不会被添加为多个指挥机
      if (
        state.commandDrones.some(
          (c) => c.drone_key === action.payload.drone_key
        )
      ) {
        return state;
      }
      return {
        ...state,
        commandDrones: [...state.commandDrones, action.payload],
      };
    case "REMOVE_COMMAND_DRONE":
      return {
        ...state,
        commandDrones: state.commandDrones.filter(
          (c) => c.drone_key !== action.payload.drone_key
        ),
      };
    case "UPDATE_COMMAND_DRONE_POSITION":
      return {
        ...state,
        commandDrones: state.commandDrones.map((c) =>
          c.drone_key === action.payload.drone_key
            ? { ...c, position: action.payload.position }
            : c
        ),
      };
    case "RESET_STATE":
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
}
