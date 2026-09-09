using System.Data;
using System.IO;
using System.Threading.Tasks;

namespace General.Librerias.CodigoUsuario
{
    public class PDF
    {
        public async static void Exportar(string archivo, DataTable tabla, string titulo="")
        {
            int nfilas = tabla.Rows.Count;
            int ncampos = tabla.Columns.Count;
            int nhojas = nfilas / 20;
            if (nfilas % 20 > 0) nhojas++;
            int ancho;
            int anchoTotal = 0;
            int cr = 0;
            await Task.Run(() =>
            {
                using (FileStream fs = new FileStream(archivo, FileMode.Create, FileAccess.Write, FileShare.Write))
                {
                    using (StreamWriter sw = new StreamWriter(fs))
                    {
                        sw.WriteLine("%PDF-1.4");
                        sw.WriteLine("1 0 obj <</Type /Catalog /Pages 2 0 R>>");
                        sw.WriteLine("endobj");
                        sw.Write("2 0 obj <</Type /Pages /Kids [");
                        for (int k = 0; k < nhojas; k++)
                        {
                            sw.Write((k * 4) + 3);
                            sw.Write(" 0 R ");
                        }
                        sw.Write("] /Count ");
                        sw.Write(nhojas);
                        sw.WriteLine(">>");
                        sw.WriteLine("endobj");
                        for (int k = 0; k < nhojas; k++)
                        {
                            sw.Write((k * 4) + 3);
                            sw.Write(" 0 obj <</Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 600 800] /Contents ");
                            sw.Write((k * 4) + 6);
                            sw.WriteLine(" 0 R>>");
                            sw.WriteLine("endobj");
                            sw.Write((k * 4) + 4);
                            sw.WriteLine(" 0 obj <</Font <</F1 5 0 R>>>>");
                            sw.WriteLine("endobj");
                            sw.Write((k * 4) + 5);
                            sw.WriteLine(" 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>");
                            sw.WriteLine("endobj");
                            sw.Write((k * 4) + 6);
                            sw.WriteLine(" 0 obj");
                            sw.WriteLine("<</Length 44>>");
                            sw.WriteLine("stream");
                            sw.Write("BT");
                            sw.Write("/F1 16 Tf 50 750 Td 0 Tr 0.5 g (");
                            sw.Write(titulo);
                            sw.Write(")Tj ");
                            sw.Write("/F1 10 Tf 0 g ");
                            sw.Write("0 -30 Td (");
                            sw.Write(tabla.Columns[0].ColumnName);
                            sw.Write(")Tj ");
                            anchoTotal = 0;
                            for (int j = 1; j < ncampos; j++)
                            {
                                ancho = int.Parse(tabla.Columns[j - 1].Caption) / 2;
                                sw.Write(ancho);
                                sw.Write(" 0 Td (");
                                sw.Write(tabla.Columns[j].ColumnName);
                                sw.Write(")Tj ");
                                anchoTotal += ancho;
                            }
                            for (int i = 0; i < 20; i++)
                            {
                                if (cr < nfilas)
                                {
                                    sw.Write("-");
                                    sw.Write(anchoTotal);
                                    sw.Write(" -30 Td (");
                                    sw.Write(tabla.Rows[cr][0].ToString());
                                    sw.Write(")Tj ");
                                    for (int j = 1; j < ncampos; j++)
                                    {
                                        ancho = int.Parse(tabla.Columns[j - 1].Caption) / 2;
                                        sw.Write(ancho);
                                        sw.Write(" 0 Td (");
                                        sw.Write(tabla.Rows[cr][j].ToString());
                                        sw.Write(")Tj ");
                                    }
                                    cr++;
                                }
                                else break;
                            }
                            sw.WriteLine("ET");
                            sw.WriteLine("endstream");
                            sw.WriteLine("endobj");
                        }
                        sw.WriteLine("xref");
                        sw.WriteLine("0 7");
                        sw.WriteLine("0000000000 65535 f");
                        sw.WriteLine("0000000009 00000 n");
                        sw.WriteLine("0000000056 00000 n");
                        sw.WriteLine("0000000111 00000 n");
                        sw.WriteLine("0000000212 00000 n");
                        sw.WriteLine("0000000250 00000 n");
                        sw.WriteLine("0000000317 00000 n");
                        sw.WriteLine("trailer <</Size 7/Root 1 0 R>>");
                        sw.WriteLine("startxref");
                        sw.WriteLine("406");
                        sw.WriteLine("%%EOF");
                    }
                }
            });
        }
    }
}
