import TableOrderClient from './TableOrderClient';

export const dynamic = 'force-dynamic';

export default function TableOrderPage({ params }: { params: { branchId: string; tableNumber: string } }) {
  return <TableOrderClient branchId={params.branchId} tableNumber={params.tableNumber} />;
}
