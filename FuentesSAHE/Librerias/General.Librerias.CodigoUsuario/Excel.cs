using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace General.Librerias.CodigoUsuario
{
    public class Excel
    {
        private enum TipoOrigen
        {
            Listas = 0,
            Tablas = 1
        }
        private static string sArchivoXlsx;
        private static string[] sHojas;
        private static string[] sRango;
        private static int nHojas;
        private static TipoOrigen tipoOrigen;
        private static List<dynamic> data;
        private static int indiceX;
        private static int indiceY;

        public static void Exportar(string archivoXlsx, string[] hojas, DataSet objData, int indiceColumna = 0, int indiceFila = 0)
        {
            data = new List<dynamic>();
            tipoOrigen = TipoOrigen.Tablas;
            sArchivoXlsx = archivoXlsx;
            sHojas = hojas;
            nHojas = hojas.Length;
            sRango = new string[nHojas];
            indiceX = indiceColumna;
            indiceY = indiceFila;
            DataTable tabla;
            for (int i = 0; i < objData.Tables.Count; i++)
            {
                tabla = objData.Tables[i];
                data.Add(tabla);
                sRango[i] = String.Format("${0}${1}", (char)(64 + tabla.Columns.Count), tabla.Rows.Count + 1);
            }
            crearDirectoriosArchivos();
        }

        private static void crearDirectoriosArchivos()
        {
            //Definir la ruta de los directorios a crear
            string sDirectorioRaiz = Path.Combine(Path.GetDirectoryName(sArchivoXlsx),
                Path.GetFileNameWithoutExtension(sArchivoXlsx));
            string sDirectorioRels = Path.Combine(sDirectorioRaiz, "_rels");
            string sDirectorioDocProps = Path.Combine(sDirectorioRaiz, "docProps");
            string sDirectorioXl = Path.Combine(sDirectorioRaiz, "xl");
            string sDirectorioXlRels = Path.Combine(sDirectorioXl, "_rels");
            string sDirectorioXlTheme = Path.Combine(sDirectorioXl, "theme");
            string sDirectorioXlWorksheets = Path.Combine(sDirectorioXl, "worksheets");
            string sDirectorioXlCharts = Path.Combine(sDirectorioXl, "charts");
            string sDirectorioXlChartSheets = Path.Combine(sDirectorioXl, "chartsheets");
            string sDirectorioXlDrawings = Path.Combine(sDirectorioXl, "drawings");
            string sDirectorioXlChartSheetsRel = Path.Combine(sDirectorioXlChartSheets, "_rels");
            string sDirectorioXlDrawingsRel = Path.Combine(sDirectorioXlDrawings, "_rels");

            //Definir la ruta de los archivos a crear
            string sArchivoContentTypes = Path.Combine(sDirectorioRaiz, "[Content_Types].xml");
            string sArchivoRels = Path.Combine(sDirectorioRels, ".rels");
            string sArchivoDocApp = Path.Combine(sDirectorioDocProps, "app.xml");
            string sArchivoDocCore = Path.Combine(sDirectorioDocProps, "core.xml");
            string sArchivoXlStyles = Path.Combine(sDirectorioXl, "styles.xml");
            string sArchivoXlWorkbook = Path.Combine(sDirectorioXl, "workbook.xml");
            string sArchivoXlRels = Path.Combine(sDirectorioXlRels, "workbook.xml.rels");
            string sArchivoXlTheme = Path.Combine(sDirectorioXlTheme, "theme1.xml");
            string[] sArchivoXlSheets = new string[nHojas];
            for (var i = 0; i < nHojas; i++) sArchivoXlSheets[i] =
                 Path.Combine(sDirectorioXlWorksheets, String.Format("sheet{0}.xml", i + 1));
            string sArchivoXlChart = Path.Combine(sDirectorioXlCharts, "chart1.xml");
            string sArchivoXlChartSheet = Path.Combine(sDirectorioXlChartSheets, "sheet1.xml");
            string sArchivoXlChartSheetRel = Path.Combine(sDirectorioXlChartSheetsRel, "sheet1.xml.rels");
            string sArchivoXlDrawing = Path.Combine(sDirectorioXlDrawings, "drawing1.xml");
            string sArchivoXlDrawingRel = Path.Combine(sDirectorioXlDrawings, "drawing1.xml.rels");

            //Crear los Directorios definidos
            DirectoryInfo oDirectorioRaiz = Directory.CreateDirectory(sDirectorioRaiz);
            oDirectorioRaiz.CreateSubdirectory("_rels");
            oDirectorioRaiz.CreateSubdirectory("docProps");
            DirectoryInfo oDirectorioXl = oDirectorioRaiz.CreateSubdirectory("xl");
            oDirectorioXl.CreateSubdirectory("_rels");
            oDirectorioXl.CreateSubdirectory("theme");
            oDirectorioXl.CreateSubdirectory("worksheets");

            //Crear los Archivos definidos
            File.WriteAllText(sArchivoContentTypes, getContentTypes());
            File.WriteAllText(sArchivoRels, getRels());
            File.WriteAllText(sArchivoDocApp, getApp());
            File.WriteAllText(sArchivoDocCore, getCore());
            File.WriteAllText(sArchivoXlStyles, getXlStyles());
            File.WriteAllText(sArchivoXlWorkbook, getXlWorkbook());
            File.WriteAllText(sArchivoXlRels, getXlRels());
            File.WriteAllText(sArchivoXlTheme, getXlTheme());
            for (var i = 0; i < nHojas; i++) getXlSheet(sArchivoXlSheets[i], i);

            //Si el archivo ya existe entonces borrar
            if (File.Exists(sArchivoXlsx)) File.Delete(sArchivoXlsx);
            //Comprimir los archivos en un Xlsx
            ZipFile.CreateFromDirectory(sDirectorioRaiz, sArchivoXlsx);
            //Borrar todo el directorio con los archivos temporales creados
            Directory.Delete(sDirectorioRaiz, true);
        }

        private static string getContentTypes()
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
            sb.Append("<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">");
            sb.Append("<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>");
            //sb.Append("<Default Extension=\"wmf\" ContentType=\"image/x-wmf\"/>");
            sb.Append("<Default Extension=\"xml\" ContentType=\"application/xml\"/>");
            sb.Append("<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>");
            sb.Append("<Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>");
            sb.Append("<Override PartName=\"/xl/theme/theme1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.theme+xml\"/>");
            sb.Append("<Override PartName=\"/docProps/core.xml\" ContentType=\"application/vnd.openxmlformats-package.core-properties+xml\"/>");
            sb.Append("<Override PartName=\"/docProps/app.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.extended-properties+xml\"/>");
            for (var i = 0; i < nHojas; i++)
            {
                sb.Append("<Override PartName=\"/xl/worksheets/sheet");
                sb.Append(i + 1);
                sb.Append(".xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>");
            }
            sb.Append("</Types>");
            return sb.ToString();
        }

        private static string getRels()
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
            sb.Append("<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">");
            sb.Append("<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties\" Target=\"docProps/core.xml\"/>");
            //sb.Append("<Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail\" Target=\"docProps/thumbnail.wmf\"/>");
            sb.Append("<Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>");
            sb.Append("<Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties\" Target=\"docProps/app.xml\"/>");
            sb.Append("</Relationships>");
            return sb.ToString();
        }

        private static string getApp()
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
            sb.Append("<Properties xmlns=\"http://schemas.openxmlformats.org/officeDocument/2006/extended-properties\" xmlns:vt=\"http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes\">");
            sb.Append("<Application>Microsoft Access</Application>");
            sb.Append("<DocSecurity>0</DocSecurity>");
            sb.Append("<ScaleCrop>false</ScaleCrop>");
            sb.Append("<HeadingPairs>");
            sb.Append("<vt:vector size=\"2\" baseType=\"variant\">");
            sb.Append("<vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant>");
            sb.Append("<vt:variant><vt:i4>1</vt:i4></vt:variant>");
            sb.Append("</vt:vector>");
            sb.Append("</HeadingPairs>");
            sb.Append("<TitlesOfParts>");
            sb.Append("<vt:vector size=\"1\" baseType=\"lpstr\">");
            sb.Append("<vt:lpstr>A266FF2A662E84b639DA</vt:lpstr>");
            sb.Append("</vt:vector>");
            sb.Append("</TitlesOfParts>");
            sb.Append("<Company>Microsoft</Company>");
            sb.Append("<LinksUpToDate>false</LinksUpToDate>");
            sb.Append("<SharedDoc>false</SharedDoc>");
            sb.Append("<HyperlinksChanged>false</HyperlinksChanged>");
            sb.Append("<AppVersion>12.0000</AppVersion>");
            sb.Append("</Properties>");
            return sb.ToString();
        }

        private static string getCore()
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
            sb.Append("<cp:coreProperties ");
            sb.Append("xmlns:cp=\"http://schemas.openxmlformats.org/package/2006/metadata/core-properties\" ");
            sb.Append("xmlns:dc=\"http://purl.org/dc/elements/1.1/\" ");
            sb.Append("xmlns:dcterms=\"http://purl.org/dc/terms/\" ");
            sb.Append("xmlns:dcmitype=\"http://purl.org/dc/dcmitype/\" ");
            sb.Append("xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">");
            sb.Append("<dc:creator>");
            sb.Append(Environment.UserName);
            sb.Append("</dc:creator>");
            sb.Append("<cp:lastModifiedBy>");
            sb.Append(Environment.UserName);
            sb.Append("</cp:lastModifiedBy>");
            sb.Append("<dcterms:created xsi:type=\"dcterms:W3CDTF\">");
            sb.Append(DateTime.Now.ToString("s"));
            sb.Append("Z</dcterms:created>");
            sb.Append("<dcterms:modified xsi:type=\"dcterms:W3CDTF\">");
            sb.Append(DateTime.Now.ToString("s"));
            sb.Append("Z</dcterms:modified>");
            sb.Append("</cp:coreProperties>");
            return sb.ToString();
        }

        private static string getXlStyles()
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("<styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">");
            sb.Append("<numFmts count='1'><numFmt numFmtId='164' formatCode='dd/mm/yyyy;@'/></numFmts>");
            sb.Append("<fonts count=\"1\">");
            sb.Append("<font>");
            sb.Append("<sz val=\"11\"/>");
            sb.Append("<color theme=\"1\"/>");
            sb.Append("<name val=\"MS Sans Serif\"/>");
            sb.Append("<family val=\"2\"/>");
            sb.Append("<scheme val=\"minor\"/>");
            sb.Append("</font>");
            sb.Append("</fonts>");
            sb.Append("<fills count=\"2\">");
            sb.Append("<fill><patternFill patternType=\"none\"/></fill>");
            sb.Append("<fill><patternFill patternType=\"gray125\"/></fill>");
            sb.Append("</fills>");
            sb.Append("<borders count=\"1\">");
            sb.Append("<border><left/><right/><top/><bottom/><diagonal/></border>");
            sb.Append("</borders>");
            sb.Append("<cellStyleXfs count=\"1\">");
            sb.Append("<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/>");
            sb.Append("</cellStyleXfs>");
            sb.Append("<cellXfs count=\"2\">");
            sb.Append("<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/>");
            sb.Append("<xf numFmtId=\"164\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyNumberFormat=\"1\"/>");
            sb.Append("</cellXfs>");
            sb.Append("<cellStyles count=\"1\">");
            sb.Append("<cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/>");
            sb.Append("</cellStyles>");
            sb.Append("<dxfs count=\"0\"/>");
            sb.Append("<tableStyles count=\"0\" defaultTableStyle=\"TableStyleMedium9\" defaultPivotStyle=\"PivotStyleLight16\"/>");
            sb.Append("</styleSheet>");
            return sb.ToString();
        }

        private static string getXlWorkbook()
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" ");
            sb.Append("xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">");
            sb.Append("<fileVersion appName=\"xl\" lastEdited=\"4\" lowestEdited=\"4\" rupBuild=\"4505\"/>");
            sb.Append("<workbookPr defaultThemeVersion=\"124226\"/>");
            sb.Append("<bookViews>");
            sb.Append("<workbookView xWindow=\"120\" yWindow=\"90\" windowWidth=\"23895\" windowHeight=\"14535\"/>");
            sb.Append("</bookViews>");
            sb.Append("<sheets>");
            for (var i = 0; i < nHojas; i++)
            {
                sb.Append("<sheet sheetId=\"");
                sb.Append(i + 1);
                sb.Append("\" r:id=\"rId");
                sb.Append(i + 3);
                sb.Append("\" name=\"");
                sb.Append(sHojas[i]);
                sb.Append("\"/>");
            }
            sb.Append("</sheets>");
            sb.Append("<definedNames>");
            for (var i = 0; i < nHojas; i++)
            {
                sb.Append("<definedName name=\"");
                sb.Append(sHojas[i]);
                sb.Append("\">'");
                sb.Append(sHojas[i]);
                sb.Append("'!$A$1:");
                sb.Append(sRango[i]);
                sb.Append("</definedName>");
            }
            sb.Append("</definedNames>");
            sb.Append("<calcPr calcId=\"125725\" fullCalcOnLoad=\"true\"/>");
            sb.Append("</workbook>");
            return sb.ToString();
        }

        private static string getXlRels()
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
            sb.Append("<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">");
            sb.Append("<Relationship Id=\"rId1\" ");
            sb.Append("Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" ");
            sb.Append("Target=\"styles.xml\"/>");
            sb.Append("<Relationship Id=\"rId2\" ");
            sb.Append("Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme\" ");
            sb.Append("Target=\"theme/theme1.xml\"/>");
            for (var i = 0; i < nHojas; i++)
            {
                sb.Append("<Relationship Id=\"rId");
                sb.Append(i + 3);
                sb.Append("\" ");
                sb.Append("Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" ");
                sb.Append("Target=\"worksheets/sheet");
                sb.Append(i + 1);
                sb.Append(".xml\"/>");
            }
            sb.Append("</Relationships>");
            return sb.ToString();
        }

        private static string getXlTheme()
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
            sb.Append("<a:theme xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" name=\"Office Theme\">");
            sb.Append("<a:themeElements>");
            sb.Append("<a:clrScheme name=\"Office\">");
            sb.Append("<a:dk1><a:sysClr val=\"windowText\" lastClr=\"000000\"/></a:dk1>");
            sb.Append("<a:lt1><a:sysClr val=\"window\" lastClr=\"FFFFFF\"/></a:lt1>");
            sb.Append("<a:dk2><a:srgbClr val=\"1F497D\"/></a:dk2>");
            sb.Append("<a:lt2><a:srgbClr val=\"EEECE1\"/></a:lt2>");
            sb.Append("<a:accent1><a:srgbClr val=\"4F81BD\"/></a:accent1>");
            sb.Append("</a:themeElements>");
            sb.Append("<a:objectDefaults/>");
            sb.Append("<a:extraClrSchemeLst/>");
            sb.Append("</a:theme>");
            return sb.ToString();
        }

        private static void getXlSheet(string sArchivoXlSheet, int nHoja)
        {
            using (StreamWriter sw = new StreamWriter(sArchivoXlSheet))
            {
                sw.Write("<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" ");
                sw.Write("xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">");
                sw.Write("<dimension ref=\"A1:");
                sw.Write(sRango[nHoja]);
                sw.Write("\"/>");
                sw.Write("<sheetViews>");
                sw.Write("<sheetView tabSelected=\"1\" workbookViewId=\"0\" rightToLeft=\"false\">");
                sw.Write("<selection activeCell=\"A1\" sqref=\"A1\"/>");
                sw.Write("</sheetView>");
                sw.Write("</sheetViews>");
                sw.Write("<sheetFormatPr defaultRowHeight=\"15\"/>");
                if (tipoOrigen.Equals(TipoOrigen.Tablas))
                {
                    sw.Write("<cols>");
                    DataTable tabla = data[nHoja];
                    int nCampos = tabla.Columns.Count;
                    for (int j = 0; j < nCampos; j++)
                    {
                        sw.Write("<col width=\"");
                        sw.Write((int.Parse(tabla.Columns[j].Caption) / 10).ToString());
                        sw.Write("\" min=\"");
                        sw.Write((j + 1).ToString());
                        sw.Write("\" max=\"");
                        sw.Write((j + 1).ToString());
                        sw.Write("\" />");
                    }
                    sw.Write("</cols>");
                }
                sw.Write("<sheetData>");
                if (tipoOrigen.Equals(TipoOrigen.Tablas)) getSheetTable(sw, nHoja);
                sw.Write("</sheetData>");
                sw.Write("<pageMargins left=\"0.7\" right=\"0.7\" top=\"0.75\" bottom=\"0.75\" header=\"0.3\" footer=\"0.3\"/>");
                sw.Write("</worksheet>");
            }
        }

        private static void getSheetTable(StreamWriter sw, int nHoja)
        {
            var tabla = data[nHoja];
            DataColumnCollection campos = tabla.Columns;
            sw.Write(String.Format("<row outlineLevel=\"0\" r=\"{0}\">", indiceY + 1));
            string celda;
            string valor;
            string tipo;
            for (int j = 0; j < campos.Count; j++)
            {
                celda = String.Format("{0}{1}", (char)(65 + j + indiceX), indiceY + 1);
                valor = campos[j].ColumnName;
                sw.Write("<c r=\"");
                sw.Write(celda);
                sw.Write("\" s=\"0\" t=\"inlineStr\"><is><t>");
                sw.Write(valor);
                sw.Write("</t></is></c>");
            }
            sw.Write("</row>");
            for (int i = 0; i < tabla.Rows.Count; i++)
            {
                sw.Write("<row outlineLevel=\"0\" r=\"");
                sw.Write(i + indiceY + 2);
                sw.Write("\">");
                for (int j = 0; j < campos.Count; j++)
                {
                    celda = String.Format("{0}{1}", (char)(65 + j + indiceX), i + indiceY + 2);
                    valor = tabla.Rows[i][j].ToString();
                    tipo = campos[j].DataType.ToString();
                    sw.Write("<c r=\"");
                    sw.Write(celda);
                    if (tipo.Contains("Date")) sw.Write("\" s=\"1\"");
                    else sw.Write("\" s=\"0\"");
                    if (tipo.Contains("String"))
                    {
                        sw.Write(" t=\"inlineStr\"><is><t>");
                        sw.Write(valor);
                        sw.Write("</t></is>");
                    }
                    else
                    {
                        sw.Write("><v>");
                        sw.Write(valor);
                        sw.Write("</v>");
                    }
                    sw.Write("</c>");
                }
                sw.Write("</row>");
            }
        }
    }
}
