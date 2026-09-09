using System.Data;
using System.Text;

namespace General.Librerias.CodigoUsuario
{
    public class PDFMemory
    {
        public static byte[] Exportar(DataTable tabla, string titulo="")
        {
            byte[] rpta = null;
            int nfilas = tabla.Rows.Count;
            int ncampos = tabla.Columns.Count;
            int nhojas = nfilas / 20;
            if (nfilas % 20 > 0) nhojas++;
            int ancho;
            int anchoTotal = 0;
            int cr = 0;

            StringBuilder sw = new StringBuilder();
            sw.AppendLine("%PDF-1.4");
            sw.AppendLine("1 0 obj <</Type /Catalog /Pages 2 0 R>>");
            sw.AppendLine("endobj");
            sw.Append("2 0 obj <</Type /Pages /Kids [");
            for (int k = 0; k < nhojas; k++)
            {
                sw.Append((k * 4) + 3);
                sw.Append(" 0 R ");
            }
            sw.Append("] /Count ");
            sw.Append(nhojas);
            sw.AppendLine(">>");
            sw.AppendLine("endobj");
            for (int k = 0; k < nhojas; k++)
            {
                sw.Append((k * 4) + 3);
                sw.Append(" 0 obj <</Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 600 800] /Contents ");
                sw.Append((k * 4) + 6);
                sw.AppendLine(" 0 R>>");
                sw.AppendLine("endobj");
                sw.Append((k * 4) + 4);
                sw.AppendLine(" 0 obj <</Font <</F1 5 0 R>>>>");
                sw.AppendLine("endobj");
                sw.Append((k * 4) + 5);
                sw.AppendLine(" 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>");
                sw.AppendLine("endobj");
                sw.Append((k * 4) + 6);
                sw.AppendLine(" 0 obj");
                sw.AppendLine("<</Length 44>>");
                sw.AppendLine("stream");
                sw.Append("BT");
                sw.Append("/F1 16 Tf 50 750 Td 0 Tr 0.5 g (");
                sw.Append(titulo);
                sw.Append(")Tj ");
                sw.Append("/F1 10 Tf 0 g ");
                sw.Append("0 -30 Td (");
                sw.Append(tabla.Columns[0].ColumnName);
                sw.Append(")Tj ");
                anchoTotal = 0;
                for (int j = 1; j < ncampos; j++)
                {
                    ancho = int.Parse(tabla.Columns[j - 1].Caption) / 2;
                    sw.Append(ancho);
                    sw.Append(" 0 Td (");
                    sw.Append(tabla.Columns[j].ColumnName);
                    sw.Append(")Tj ");
                    anchoTotal += ancho;
                }
                for (int i = 0; i < 20; i++)
                {
                    if (cr < nfilas)
                    {
                        sw.Append("-");
                        sw.Append(anchoTotal);
                        sw.Append(" -30 Td (");
                        sw.Append(tabla.Rows[cr][0].ToString());
                        sw.Append(")Tj ");
                        for (int j = 1; j < ncampos; j++)
                        {
                            ancho = int.Parse(tabla.Columns[j - 1].Caption) / 2;
                            sw.Append(ancho);
                            sw.Append(" 0 Td (");
                            sw.Append(tabla.Rows[cr][j].ToString());
                            sw.Append(")Tj ");
                        }
                        cr++;
                    }
                    else break;
                }
                sw.AppendLine("ET");
                sw.AppendLine("endstream");
                sw.AppendLine("endobj");
            }
            sw.AppendLine("xref");
            sw.AppendLine("0 7");
            sw.AppendLine("0000000000 65535 f");
            sw.AppendLine("0000000009 00000 n");
            sw.AppendLine("0000000056 00000 n");
            sw.AppendLine("0000000111 00000 n");
            sw.AppendLine("0000000212 00000 n");
            sw.AppendLine("0000000250 00000 n");
            sw.AppendLine("0000000317 00000 n");
            sw.AppendLine("trailer <</Size 7/Root 1 0 R>>");
            sw.AppendLine("startxref");
            sw.AppendLine("406");
            sw.AppendLine("%%EOF");
            rpta = Encoding.Default.GetBytes(sw.ToString());

            return rpta;
        }
    }
}
