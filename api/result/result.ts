export interface DetectResultItem {
  id?: number;
  job_name?: string;
  target_class?: string;
  target_label?: string;
  lng?: number;
  lat?: number;
  created_at?: string;
}

export function fetchAllDetectResults(): Promise<DetectResultItem[]> {
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
  ];
  return new Promise((resolve) => resolve(res));
}
