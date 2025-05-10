/**
 * 搜索结果单项接口
 */
export interface SearchResultItem {
  id: number;
  job_name: string;
  target_label: string;
  lng: string;
  lat: string;
  created_at: string;
  image_url: string;
}

/**
 * 搜索结果响应接口
 */
export interface SearchResult {
  data: {
    items: SearchResultItem[];
    total: number;
  };
}
