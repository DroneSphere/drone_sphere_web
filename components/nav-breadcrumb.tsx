import { useNavigation } from "@/contexts/navigation-context";
import { Link } from "lucide-react";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";

export function BreadcrumbNav() {
  const { getBreadcrumbs } = useNavigation();
  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <Link href="/dashboard">仪表盘</Link>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="ml-2" />

        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {index === breadcrumbs.length - 1 ? (
                crumb.title
              ) : (
                <Link href={crumb.url}>{crumb.title}</Link>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && (
              <BreadcrumbSeparator className="ml-2" />
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
