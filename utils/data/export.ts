import { LotsRepository, SalesRepository } from "@/db/repositories";
import {
    documentDirectory,
    EncodingType,
    writeAsStringAsync,
} from "expo-file-system";
import * as Sharing from "expo-sharing";

export async function exportDataToCSV() {
  try {
    // Fetch all data
    const lots = await LotsRepository.getAll();
    const sales = await SalesRepository.getAll();

    // CSV Construction
    let csv = "--- LOTS ---\n";
    csv += "ID,Provider,Date,Cost,Fees,Qty\n";
    lots.forEach((l) => {
      csv += `${l.id},"${l.provider}",${l.buyDate},${l.totalCost},${l.additionalFees},${l.initialQuantity}\n`;
    });

    csv += "\n--- SALES ---\n";
    csv += "ID,Date,LotID,ItemID,PriceNet,Status\n";
    sales.forEach((s) => {
      csv += `${s.id},${s.saleDate},${s.lotId},${s.itemId},${s.priceNet},${s.status}\n`;
    });

    // Write to file
    const fileName = `optimus-vintage-backup-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    const filePath = (documentDirectory || "") + fileName;

    await writeAsStringAsync(filePath, csv, { encoding: EncodingType.UTF8 });

    // Share
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath);
    } else {
      return "Sharing not available on this device";
    }

    return true;
  } catch (e) {
    console.error("Export failed", e);
    throw e;
  }
}
