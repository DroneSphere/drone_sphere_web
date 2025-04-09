import { SearchResult } from "./type";

/**
 * 获取搜索结果
 * @param jobId 任务ID
 * @returns 搜索结果
 */
export const getSearchResults = async (
  jobId: string
): Promise<SearchResult> => {
  const response = await fetch(
    `http://127.0.0.1:10086/api/v1/results?job_id=${jobId}`
  );

  if (!response.ok) {
    throw new Error("获取搜索结果失败");
  }

  return response.json();
};
