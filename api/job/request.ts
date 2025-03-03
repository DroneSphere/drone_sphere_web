import httpClient from "../http_client";
import { Response } from "../response";
import {
  JobCreationOptionsResult,
  JobEditionResult,
  JobItemResult,
  JobSearchParams,
  SubJobResult,
} from "./types";

const prefix = "/job";

export async function fetchAllJobs(
  params: JobSearchParams | null = null
): Promise<JobItemResult[]> {
  console.log("fetchAllJobs", params);

  const res = await httpClient.instance.get<Response<JobItemResult[]>>(
    `${prefix}`
  );
  return res.data.data;
}

export async function fetchJobDetail(id: number): Promise<SubJobResult[]> {
  const res = await httpClient.instance.get<Response<SubJobResult[]>>(
    `${prefix}/${id}`
  );
  return res.data.data;
}

export async function fetchJobCreateionOptions(): Promise<JobCreationOptionsResult> {
  const mockOptions: JobCreationOptionsResult = {
    droneModels: [
      {
        model: "DJI Mavic 3",
        key: "mavic3",
        drones: [
          {
            id: 1,
            callsign: "Drone A",
            description: "Description A",
            sn: "SN123",
          },
          {
            id: 2,
            callsign: "Drone B",
            description: "Description B",
            sn: "SN456",
          },
        ],
      },
      {
        model: "DJI Phantom 4",
        key: "phantom4",
        drones: [
          {
            id: 3,
            callsign: "Drone C",
            description: "Description C",
            sn: "SN789",
          },
          {
            id: 4,
            callsign: "Drone D",
            description: "Description D",
            sn: "SN012",
          },
          {
            id: 5,
            callsign: "Drone E",
            description: "Description E",
            sn: "SN345",
          },
        ],
      },
    ],
    areas: [
      {
        id: 1,
        name: "Area A",
        description: "Description A",
      },
      {
        id: 2,
        name: "Area B",
        description: "Description B",
      },
    ],
  };

  // Random delay between 300-1000ms before returning mock data
  return new Promise((resolve) => {
    const delay = Math.floor(Math.random() * (1000 - 300 + 1)) + 300;
    setTimeout(() => {
      resolve(mockOptions);
    }, delay);
  });
}

export async function fetchJobEditionData(
  id: number
): Promise<JobEditionResult> {
  console.log("fetchJobEditionData", id);

  const mockOptions: JobEditionResult = {
    droneModel: "DJI Mavic 3",
    drones: [
      {
        id: 1,
        callsign: "Drone A",
        description: "Description A",
        sn: "SN123",
        rtk_available: true,
        thermal_available: true,
      },
      {
        id: 2,
        callsign: "Drone B",
        description: "Description B",
        sn: "SN456",
        rtk_available: true,
        thermal_available: false,
      },
    ],
    area: {
      name: "Area A",
      points: [
        { lat: 36.666631, lng: 117.138154, marker: "A" },
        { lat: 36.667631, lng: 117.139154, marker: "B" },
        { lat: 36.665631, lng: 117.139154, marker: "C" },
      ],
    },
  };
  // Random delay between 300-1000ms before returning mock data
  return new Promise((resolve) => {
    const delay = Math.floor(Math.random() * (1000 - 300 + 1)) + 300;
    setTimeout(() => {
      resolve(mockOptions);
    }, delay);
  });
  // const res = await httpClient.instance.get<Response<JobEditionResult>>(
  //   `${prefix}/${id}/edit`
  // );
  // return res.data.data;
}
