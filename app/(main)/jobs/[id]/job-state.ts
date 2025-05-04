import { JobDetailResult } from "./types";

// 定义各种状态类型
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

// 统一的任务状态类型
export interface JobState {
  selectedDrones: DroneState[];
  waylineAreas: WaylineAreaState[];
  droneMappings: DroneMappingState[];
  path: AMap.LngLat[]; // 区域路径
}

// 定义所有可能的动作
export type JobAction =
  | { type: 'SET_SELECTED_DRONES'; payload: DroneState[] }
  | { type: 'SET_WAYLINE_AREAS'; payload: WaylineAreaState[] }
  | { type: 'UPDATE_WAYLINE_AREA'; payload: { index: number; wayline: Partial<WaylineAreaState> } }
  | { type: 'SET_DRONE_MAPPINGS'; payload: DroneMappingState[] }
  | { type: 'UPDATE_DRONE_MAPPING'; payload: { key: string; mapping: Partial<DroneMappingState> } }
  | { type: 'ADD_DRONE'; payload: DroneState }
  | { type: 'REMOVE_DRONE'; payload: { key: string } }
  | { type: 'SET_PATH'; payload: AMap.LngLat[] }
  | { type: 'RESET_STATE'; payload: Partial<JobState> };

// 创建初始状态
export const initialJobState: JobState = {
  selectedDrones: [],
  waylineAreas: [],
  droneMappings: [],
  path: [],
};

// 创建reducer函数
export function jobReducer(state: JobState, action: JobAction): JobState {
  switch (action.type) {
    case 'SET_SELECTED_DRONES':
      return {
        ...state,
        selectedDrones: action.payload
      };
    case 'SET_WAYLINE_AREAS':
      return {
        ...state,
        waylineAreas: action.payload
      };
    case 'UPDATE_WAYLINE_AREA':
      return {
        ...state,
        waylineAreas: state.waylineAreas.map((area, index) => 
          index === action.payload.index 
            ? { ...area, ...action.payload.wayline } 
            : area
        )
      };
    case 'SET_DRONE_MAPPINGS':
      return {
        ...state,
        droneMappings: action.payload
      };
    case 'UPDATE_DRONE_MAPPING':
      return {
        ...state,
        droneMappings: state.droneMappings.map(mapping => 
          mapping.selected_drone_key === action.payload.key
            ? { ...mapping, ...action.payload.mapping }
            : mapping
        )
      };
    case 'ADD_DRONE': {
      // 添加无人机，并创建默认映射
      const newDrone = action.payload;
      const newMapping: DroneMappingState = {
        selected_drone_key: newDrone.key,
        physical_drone_id: 0,
        lens_type: "visible"
      };
      
      return {
        ...state,
        selectedDrones: [...state.selectedDrones, newDrone],
        droneMappings: [...state.droneMappings, newMapping]
      };
    }
    case 'REMOVE_DRONE': {
      // 移除无人机及其相关的映射和航线
      const droneKey = action.payload.key;
      return {
        ...state,
        selectedDrones: state.selectedDrones.filter(drone => drone.key !== droneKey),
        droneMappings: state.droneMappings.filter(mapping => mapping.selected_drone_key !== droneKey),
        waylineAreas: state.waylineAreas.filter(area => area.droneKey !== droneKey)
      };
    }
    case 'SET_PATH':
      return {
        ...state,
        path: action.payload
      };
    case 'RESET_STATE':
      return {
        ...state,
        ...action.payload
      };
    default:
      return state;
  }
}
