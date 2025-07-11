import { JobDetailResult, JobDroneVariation } from "./types";

// 定义各种状态类型
export type Camera = {
  // 摄像头类型
  type: string,
  // 摄像头名称
  label: string,
  //实际焦段
  focal_length: number,
  //最小焦段
  min_focal_length: number,
  //最大焦段
  max_focal_length: number,
  //等价焦段
  equivalent_focal_length: number,
  //等价最大焦段
  min_equivalent_focal_length: number,
  //等价最小焦段
  max_equivalent_focal_length: number,
  //是否可以缩放倍率
  is_zoomable: boolean,
  //最小缩放倍率
  min_zoom_factor: number,
  //最大缩放倍率
  max_zoom_factor: number
} 
export type DroneStateV2 = {
  /** 无人机唯一键, 格式：${index}-${model_id}-${variation_index} */
  key: string;
  /** 无人机索引（可选） */
  index?: number;
  /** 无人机型号ID */
  model_id: number;
  /** 无人机实例ID */
  physical_drone_id?: number;
  physical_drone_sn?: string;
  physical_drone_callsign?: string;
  /** 无人机名称 */
  name: string;
  /** 无人机描述（可选） */
  description?: string;
  /** 无人机颜色 */
  color: string;
  lens_type: string; // 镜头类型
  /** 无人机变体信息 */
  variation: JobDroneVariation;
  /** 无人机起飞点位置 */
  takeoffPoint?: {
    /** 纬度 */
    lat: number;
    /** 经度 */
    lng: number;
    /** 高度(米) */
    altitude: number;
  };
  wayline_name?: string;
  wayline_url?: string;
  cameras?:Camera[]
};
export type DroneState = JobDetailResult["drones"][0];
export type WaylineAreaState = {
  droneKey: string;
  color: string;
  altitude: number; // 区域高度
  path: AMap.LngLat[];
  waypoints?: AMap.LngLat[];
  visible?: boolean;
  gimbalPitch?: number; // 云台俯仰角参数，默认-90度（垂直向下）
  gimbalZoom?: number; // 云台放大倍数参数，默认1倍
};

// 指挥机状态定义
export type CommandDroneState = {
  /** 关联到selectedDrones中的无人机唯一键 */
  droneKey: string;
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

// 定义航线参数状态接口
export interface WaylineParamsState {
  flyingHeight: number; // 飞行高度(米)
  coverageWidth: number; // 覆盖宽度(米)
  overlapRate: number; // 重叠率 (0-1)
  heightInterval: number; // 航线层高间隔(米)
  gimbalPitch: number; // 云台俯仰角(度)
  gimbalZoom: number; // 云台变焦倍数
}

// 统一的任务状态类型
export interface JobState {
  drones: DroneStateV2[];
  waylineAreas: WaylineAreaState[];
  path: AMap.LngLat[]; // 区域路径
  commandDrones: CommandDroneState[]; // 指挥机列表
  waylineParams: WaylineParamsState; // 航线参数
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
  | {
      type: "SET_DRONE_TAKEOFF_POINT";
      payload: {
        drone_key: string;
        takeoffPoint: { lat: number; lng: number; altitude: number };
      };
    }
  | {
      type: "REMOVE_DRONE_TAKEOFF_POINT";
      payload: { drone_key: string };
    }
  | {
      type: "UPDATE_DRONE_COLOR";
      payload: { drone_key: string; color: string };
    }
  | {
      type: "UPDATE_COMMAND_DRONE_COLOR";
      payload: { drone_key: string; color: string };
    }
  | { type: "RESET_STATE"; payload: Partial<JobState> }
  | { type: "SET_WAYLINE_PARAMS"; payload: Partial<WaylineParamsState> }; // 添加设置航线参数的动作

// 创建初始状态
export const initialJobState: JobState = {
  drones: [],
  waylineAreas: [],
  path: [],
  commandDrones: [], // 添加空的指挥机数组
  // 初始化航线参数，使用 wayline-panel.tsx 中的默认值
  waylineParams: {
    flyingHeight: 30, // 默认飞行高度30米
    coverageWidth: 12, // 默认每次覆盖12米宽 (注意原为20米，根据wayline-panel.tsx修改为12)
    overlapRate: 0.1, // 默认20%的重叠率
    heightInterval: 0.5, // 默认航线层高间隔0.5米 (注意原为5米，根据wayline-panel.tsx修改为0.5)
    gimbalPitch: -90, // 默认云台俯仰角-90度（垂直向下）
    gimbalZoom: 1, // 默认放大倍数1x
  },
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
          (c) => c.droneKey === action.payload.droneKey
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
          (c) => c.droneKey !== action.payload.drone_key
        ),
      };
    case "UPDATE_COMMAND_DRONE_POSITION":
      return {
        ...state,
        commandDrones: state.commandDrones.map((c) =>
          c.droneKey === action.payload.drone_key
            ? { ...c, position: action.payload.position }
            : c
        ),
      };
    case "SET_DRONE_TAKEOFF_POINT":
      return {
        ...state,
        drones: state.drones.map((drone) =>
          drone.key === action.payload.drone_key
            ? { ...drone, takeoffPoint: action.payload.takeoffPoint }
            : drone
        ),
      };
    case "REMOVE_DRONE_TAKEOFF_POINT":
      return {
        ...state,
        drones: state.drones.map((drone) =>
          drone.key === action.payload.drone_key
            ? { ...drone, takeoffPoint: undefined }
            : drone
        ),
      };
    case "UPDATE_DRONE_COLOR":
      return {
        ...state,
        drones: state.drones.map((drone) =>
          drone.key === action.payload.drone_key
            ? { ...drone, color: action.payload.color }
            : drone
        ),
        // 同步更新指挥机的颜色（如果使用了该无人机）
        commandDrones: state.commandDrones.map((commandDrone) =>
          commandDrone.droneKey === action.payload.drone_key
            ? { ...commandDrone, color: action.payload.color }
            : commandDrone
        ),
      };
    case "UPDATE_COMMAND_DRONE_COLOR":
      return {
        ...state,
        commandDrones: state.commandDrones.map((commandDrone) =>
          commandDrone.droneKey === action.payload.drone_key
            ? { ...commandDrone, color: action.payload.color }
            : commandDrone
        ),
      };
    case "RESET_STATE":
      return {
        ...state,
        ...action.payload,
      };
    case "SET_WAYLINE_PARAMS": // 处理设置航线参数的动作
      return {
        ...state,
        waylineParams: {
          ...state.waylineParams,
          ...action.payload,
        },
      };
    default:
      return state;
  }
}
