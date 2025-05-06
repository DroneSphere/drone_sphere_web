/**
 * 任务详情页面 - 优化版本
 * 采用reducer管理状态，分离地图逻辑，减少不必要的重渲染
 */
"use client";

import { useEffect, useCallback, useReducer } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  createJob,
  getJobCreateOpytions,
  getJobDetailById,
  updateJob,
} from "./requests";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useIsCreateMode } from "@/lib/misc";

import TaskInfoPanel from "./task-info-panel";
import WaylinePanel from "./wayline-panel";
import DronePanel from "./drone-panel";
import { jobReducer, initialJobState } from "./job-state";
import { useMap } from "./use-map";
import {
  formatDronesData,
  formatMappingsData,
  formatWaylinesData,
  prepareSubmitData,
  validateJobData,
} from "./data-utils";
import { JobCreationRequest, JobEditRequest } from "./types";

// 定义表单验证模式
const formSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  schedule_time: z
    .string()
    .regex(
      /^\d{4}-([0][1-9]|1[0-2])-([0-2][0-9]|3[0-1])\s([01][0-9]|2[0-3]):[0-5][0-9]$/,
      "请输入有效的时间格式 (yyyy-MM-DD HH:mm)"
    )
    .optional(),
  area_id: z.number().optional(),
});

export default function Page() {
  const router = useRouter();

  // 使用map自定义hook
  const { AMapRef, mapRef, isMapLoaded, drawAreaPolygon, drawWaylines } =
    useMap();

  // 使用reducer管理复杂状态
  const [state, dispatch] = useReducer(jobReducer, initialJobState);

  // 计算工作状态
  const { isCreateMode: isCreating, idPart } = useIsCreateMode();

  // 编辑和创建需要的参数
  const optionsQuery = useQuery({
    queryKey: ["job-creation-options"],
    queryFn: () => getJobCreateOpytions(),
  });

  // 编辑或浏览时查询已有的数据
  const dataQuery = useQuery({
    queryKey: ["jobs", parseInt(idPart)],
    queryFn: () => getJobDetailById(parseInt(idPart)),
    enabled: !isCreating,
  });

  // 表单设置
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      schedule_time: "",
      area_id: 0,
    },
  });

  // 处理数据加载与更新表单
  const updateFormAndState = useCallback(() => {
    if (!dataQuery.data || !isMapLoaded || !AMapRef.current) return;

    const { area } = dataQuery.data;

    // 设置表单值
    form.reset({
      name: dataQuery.data.name,
      description: dataQuery.data.description,
      schedule_time: dataQuery.data.schedule_time,
      area_id: dataQuery.data.area?.id || 0,
    });

    // 使用数据工具函数格式化并更新状态
    const formattedDrones = formatDronesData(dataQuery.data.drones);
    const formattedMappings = formatMappingsData(dataQuery.data.mappings);
    const formattedWaylines = formatWaylinesData(
      dataQuery.data.waylines,
      AMapRef.current
    );

    // 设置区域路径
    if (area?.points) {
      const areaPath = area.points.map(
        (p) => new AMapRef.current!.LngLat(p.lng, p.lat)
      );
      dispatch({ type: "SET_PATH", payload: areaPath });
    }

    // 使用一次dispatch更新所有状态，避免多次渲染
    dispatch({
      type: "RESET_STATE",
      payload: {
        selectedDrones: formattedDrones,
        droneMappings: formattedMappings,
        waylineAreas: formattedWaylines,
      },
    });

    console.log("数据加载完成，状态已更新");
  }, [dataQuery.data, isMapLoaded, AMapRef, form]);

  // 处理数据提交
  function onSubmit(formData: z.infer<typeof formSchema>) {
    console.log("提交表单数据", formData);

    // 验证数据
    const validation = validateJobData(
      state.selectedDrones,
      state.waylineAreas,
      state.droneMappings
    );
    if (!validation.isValid) {
      toast({
        title: "操作失败",
        description: validation.errorMessage,
        variant: "destructive",
      });
      return;
    }

    // 准备提交数据
    const submitData = prepareSubmitData(formData, {
      selectedDrones: state.selectedDrones,
      waylineAreas: state.waylineAreas,
      droneMappings: state.droneMappings,
    });

    console.log("提交数据", submitData);

    if (isCreating) {
      createMutation.mutate(submitData);
    } else {
      // 编辑模式下添加id字段
      editionMutation.mutate({
        ...submitData,
        id: parseInt(idPart),
      });
    }
  }

  // 创建任务
  const createMutation = useMutation({
    mutationFn: (data: JobCreationRequest) => createJob(data),
    onSuccess: (data) => {
      if (!data || data <= 0) {
        toast({
          title: "操作失败",
          description: "任务创建失败",
          variant: "destructive",
        });
        return;
      }
      console.log("创建任务成功", data);
      toast({
        title: "操作成功",
        description: "任务创建成功",
      });
      router.replace(`/jobs/${data}`);
    },
    onError: (error) => {
      console.error("创建任务失败", error);
      toast({
        title: "操作失败",
        description: "任务创建失败",
        variant: "destructive",
      });
    },
  });

  // 更新任务
  const editionMutation = useMutation({
    mutationFn: (data: JobEditRequest) => updateJob(data),
    onSuccess: () => {
      toast({
        title: "操作成功",
        description: "任务更新成功",
      });
      dataQuery.refetch();
    },
    onError: (error) => {
      console.error("更新任务失败", error);
      toast({
        title: "操作失败",
        description: "任务更新失败",
        variant: "destructive",
      });
    },
  });

  // 处理多边形编辑回调
  const handlePolygonEdit = useCallback(
    (index: number, newPath: AMap.LngLat[]) => {
      dispatch({
        type: "UPDATE_WAYLINE_AREA",
        payload: { index, wayline: { path: newPath } },
      });
    },
    []
  );

  // 只在数据加载完成后更新状态
  useEffect(() => {
    if (dataQuery.isSuccess && dataQuery.data && isMapLoaded) {
      updateFormAndState();
    }
  }, [dataQuery.isSuccess, dataQuery.data, isMapLoaded, updateFormAndState]);

  // 监听路径变化，更新地图
  useEffect(() => {
    if (isMapLoaded && state.path && state.path.length > 0) {
      drawAreaPolygon(state.path);
    }
  }, [isMapLoaded, state.path, drawAreaPolygon]);

  // 监听航线区域变化，更新地图
  useEffect(() => {
    if (isMapLoaded && state.waylineAreas.length > 0) {
      // 传入回调函数用于处理多边形编辑
      drawWaylines(
        state.waylineAreas,
        state.drones,
        isCreating,
        handlePolygonEdit
      );
    }
  }, [
    isMapLoaded,
    state.waylineAreas,
    state.drones,
    state.selectedDrones,
    isCreating,
    drawWaylines,
    handlePolygonEdit,
  ]);

  // 删除各种setXXX方法，子组件将直接使用dispatch
  // 子组件内部会直接调用dispatch({ type: "SET_XXX", payload: xxx });

  return (
    <div className="px-4 mb-4">
      <div className="flex gap-4">
        <div
          id="map"
          className="h-[calc(100vh-132px)] w-full border rounded-md shadow-sm"
        />
        <div className="w-[460px]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="max-h-[calc(100vh-180px)] overflow-y-auto pl-2 pr-4 space-y-4">
                <TaskInfoPanel
                  isEditing={true}
                  isCreating={isCreating}
                  form={form}
                  optionsQuery={optionsQuery}
                  dataQuery={dataQuery}
                  state={state}
                  dispatch={dispatch}
                  AMapRef={AMapRef}
                />
                <DronePanel
                  availableDrones={optionsQuery.data?.drones || []}
                  state={state}
                  dispatch={dispatch}
                />
                <WaylinePanel
                  state={state}
                  dispatch={dispatch}
                  AMapRef={AMapRef}
                  mapRef={mapRef}
                />
              </div>

              <div className="mt-4 flex justify-end gap-4">
                <Button
                  disabled={
                    !isMapLoaded ||
                    createMutation.isPending ||
                    editionMutation.isPending
                  }
                  className="px-4 bg-blue-400 text-gray-100 hover:bg-blue-500 flex items-center"
                  type="submit"
                >
                  保存
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
