import TableOrderClient from './TableOrderClient';

// Generate static params for all table numbers
export function generateStaticParams() {
  const tableNumbers = [
    'A1', 'A2', 'A3', 'A4',
    'B1', 'B2', 'B3',
    'C1', 'C2', 'C3', 'C4'
  ];

  return tableNumbers.map((tableNumber) => ({
    tableNumber: tableNumber,
  }));
}

export default function TableOrderPage({ params }: { params: { tableNumber: string } }) {
  return <TableOrderClient tableNumber={params.tableNumber} />;
}
