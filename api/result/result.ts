export interface DetectResultItem {
  id?: number;
  job_name?: string;
  target_class?: string;
  target_label?: string;
  lng?: number;
  lat?: number;
  created_at?: string;
}

export interface DetectSearchParams {
  name?: string;
  class?: string[];
  createAtBegin?: string;
  createAtEnd?: string;
}

export function fetchAllDetectResults(
  params: DetectSearchParams | null = null
): Promise<DetectResultItem[]> {
  console.log(params);
  setTimeout(() => {}, 1000);

  const res = [
    {
      id: 1,
      job_name: "job1",
      target_class: "class1",
      target_label: "label1",
      lng: 123.456,
      lat: 78.91,
      created_at: "2023-10-01T12:00:00Z",
    },
    {
      id: 2,
      job_name: "job2",
      target_class: "class2",
      target_label: "label2",
      lng: 223.456,
      lat: 178.91,
      created_at: "2023-10-02T12:00:00Z",
    },
    {
      id: 3,
      job_name: "job3",
      target_class: "class3",
      target_label: "label3",
      lng: 323.456,
      lat: 278.91,
      created_at: "2023-10-03T12:00:00Z",
    },
  ];
  if (params) {
    // 随机删除一个元素用于测试
    res.splice(Math.floor(Math.random() * res.length), 1);
  }
  return new Promise((resolve) => resolve(res));
}
