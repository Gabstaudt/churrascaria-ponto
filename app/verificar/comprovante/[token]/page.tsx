import { FileCheck2, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { verifyPublicReceipt } from "@/modules/point-receipts/services/point-receipt.service";

export default async function VerifyReceiptPage({ params }: PageProps<"/verificar/comprovante/[token]">) {
  const { token } = await params;
  const receipt = await verifyPublicReceipt(token);
  if (!receipt) notFound();
  const snapshot = receipt.snapshot;
  const instant = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "medium", timeZone: snapshot.timezone ?? "America/Belem" }).format(receipt.recordedAt);

  return <main className="public-receipt-page"><section className="public-receipt-card"><span className="public-receipt-seal"><ShieldCheck /></span><p className="eyebrow">UpTime · verificação pública</p><h1>Comprovante autêntico</h1><p>Este registro eletrônico está disponível e sua referência foi localizada com segurança.</p><dl><div><dt>Empregador</dt><dd>{snapshot.employerName}</dd></div><div><dt>Estabelecimento</dt><dd>{snapshot.establishmentName}</dd></div><div><dt>Data e hora</dt><dd>{instant}</dd></div><div><dt>NSR</dt><dd>{receipt.nsr}</dd></div><div><dt>Formato</dt><dd>{receipt.formatVersion}</dd></div></dl><footer><FileCheck2 size={17} /> A consulta pública não revela nome, CPF ou matrícula do funcionário.</footer></section></main>;
}
