import { CustomerOrderDetailPage } from "@/components/customer-order-detail-page";

export default function Page({ params }: { params: { publicNumber: string } }) {
  return <CustomerOrderDetailPage publicNumber={params.publicNumber} />;
}
