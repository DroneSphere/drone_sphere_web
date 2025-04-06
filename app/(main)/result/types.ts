// 检测结果列表项
export interface ResultItem {
  id: number;
  job_id: number;
  job_name: string;
  target_label: string;
  lng: string;
  lat: string;
  created_at: string;
}

// 检测结果详情
export interface ResultDetail {
  id: number;
  job_id: number;
  job_name: string;
  wayline_id: number;
  drone_id: number;
  object_type: number;
  object_label: string;
  object_confidence: number;
  position: {
    h: number;
    w: number;
    x: number;
    y: number;
  };
  coordinate: {
    lat: number;
    lng: number;
  };
  image_url: string;
  created_at: string;
}

// 检测结果查询参数
export interface ResultQuery {
  job_id?: number;
  object_type?: number;
  page: number;
  page_size: number;
}