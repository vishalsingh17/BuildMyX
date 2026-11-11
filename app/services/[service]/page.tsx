import { notFound } from "next/navigation";
import { servicePages, servicePageTitle } from "@/lib/services";
import { pageMetadata } from "@/lib/metadata";
import { ServicePage } from "@/components/service-page";

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(servicePages).map((service) => ({ service }));
}

type Props = { params: Promise<{ service: string }> };

export async function generateMetadata({ params }: Props) {
  const { service: slug } = await params;
  const service = servicePages[slug];
  if (!service) return {};
  return pageMetadata(
    servicePageTitle(service),
    service.intro,
    `/services/${slug}/`,
  );
}

export default async function ServiceDetail({ params }: Props) {
  const { service: slug } = await params;
  const service = servicePages[slug];
  if (!service) notFound();
  return <ServicePage service={service} />;
}
