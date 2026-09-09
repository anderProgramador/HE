using System;
using System.IO;
using System.Data;
using System.Text;
using System.Collections.Generic;

namespace General.Librerias.CodigoUsuario
{
    public class ExcelMemory
    {
        private enum TipoOrigen
        {
            Listas = 0,
            Tablas = 1
        }
        private string[] sHojas;
        private string[] sRango;
        private int nHojas;
        private TipoOrigen tipoOrigen;
        private List<dynamic> data;
        private int indiceX;
        private int indiceY;

        private List<Archivos> LstArchivos = new List<Archivos>();

        public byte[] Exportar(string[] hojas, DataSet objData, int indiceColumna = 0, int indiceFila = 0)
        {
            data = new List<dynamic>();
            tipoOrigen = TipoOrigen.Tablas;
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
            LstArchivos = new List<Archivos>();
            return crearDirectoriosArchivos();
        }

        private byte[] crearDirectoriosArchivos()
        {
            //Definir la ruta de los directorios a crear
            //string sDirectorioRaiz = Path.Combine(Path.GetDirectoryName(sArchivoXlsx),
            //    Path.GetFileNameWithoutExtension(sArchivoXlsx));


            //string sDirectorioRels = Path.Combine(sDirectorioRaiz, "_rels");
            //string sDirectorioDocProps = Path.Combine(sDirectorioRaiz, "docProps");
            //string sDirectorioXl = Path.Combine(sDirectorioRaiz, "xl");

            //string sDirectorioXlRels = Path.Combine(sDirectorioXl, "_rels");
            //string sDirectorioXlTheme = Path.Combine(sDirectorioXl, "theme");
            //string sDirectorioXlWorksheets = Path.Combine(sDirectorioXl, "worksheets");
            //string sDirectorioXlCharts = Path.Combine(sDirectorioXl, "charts");
            //string sDirectorioXlChartSheets = Path.Combine(sDirectorioXl, "chartsheets");
            //string sDirectorioXlDrawings = Path.Combine(sDirectorioXl, "drawings");
            //string sDirectorioXlChartSheetsRel = Path.Combine(sDirectorioXlChartSheets, "_rels");
            //string sDirectorioXlDrawingsRel = Path.Combine(sDirectorioXlDrawings, "_rels");


            Archivos oArchivos = new Archivos();
            //Definir la ruta de los archivos a crear
            // string sArchivoContentTypes = Path.Combine(sDirectorioRaiz, "[Content_Types].xml");
            oArchivos.Extension = "xml";
            oArchivos.Nombre = "[Content_Types]";
            oArchivos.FileBytes = new byte[] { };
            LstArchivos.Add(oArchivos);

            //string sArchivoRels = Path.Combine(sDirectorioRels, ".rels");

            oArchivos = new Archivos();
            oArchivos.Extension = "rels";
            oArchivos.Nombre = "_rels/";
            oArchivos.FileBytes = new byte[] { };
            LstArchivos.Add(oArchivos);

            //string sArchivoDocApp = Path.Combine(sDirectorioDocProps, "app.xml");

            oArchivos = new Archivos();
            oArchivos.Extension = "xml";
            oArchivos.Nombre = "docProps/app";
            oArchivos.FileBytes = new byte[] { };
            LstArchivos.Add(oArchivos);

            //string sArchivoDocCore = Path.Combine(sDirectorioDocProps, "core.xml");

            oArchivos = new Archivos();
            oArchivos.Extension = "xml";
            oArchivos.Nombre = "docProps/core";
            oArchivos.FileBytes = new byte[] { };
            LstArchivos.Add(oArchivos);

            // string sArchivoXlStyles = Path.Combine(sDirectorioXl, "styles.xml");
            oArchivos = new Archivos();
            oArchivos.Extension = "xml";
            oArchivos.Nombre = "xl/styles";
            oArchivos.FileBytes = new byte[] { };
            LstArchivos.Add(oArchivos);

            //string sArchivoXlWorkbook = Path.Combine(sDirectorioXl, "workbook.xml");

            oArchivos = new Archivos();
            oArchivos.Extension = "xml";
            oArchivos.Nombre = "xl/workbook";
            oArchivos.FileBytes = new byte[] { };
            LstArchivos.Add(oArchivos);

            //string sArchivoXlRels = Path.Combine(sDirectorioXlRels, "workbook.xml.rels");

            oArchivos = new Archivos();
            oArchivos.Extension = "rels";
            oArchivos.Nombre = "xl/_rels/workbook.xml";
            oArchivos.FileBytes = new byte[] { };
            LstArchivos.Add(oArchivos);

            //string sArchivoXlTheme = Path.Combine(sDirectorioXlTheme, "theme1.xml");

            oArchivos = new Archivos();
            oArchivos.Extension = "xml";
            oArchivos.Nombre = "xl/theme/theme1";
            oArchivos.FileBytes = new byte[] { };
            LstArchivos.Add(oArchivos);

            string[] sArchivoXlSheets = new string[nHojas];
            for (var i = 0; i < nHojas; i++)
            {
                //sArchivoXlSheets[i] = Path.Combine(sDirectorioXlWorksheets, String.Format("sheet{0}.xml", i + 1));

                oArchivos = new Archivos();
                oArchivos.Extension = "xml";
                oArchivos.Nombre = String.Format("xl/worksheets/sheet{0}", i + 1);
                oArchivos.FileBytes = new byte[] { };
                LstArchivos.Add(oArchivos);

            }


            //string sArchivoXlChart = Path.Combine(sDirectorioXlCharts, "chart1.xml");

            oArchivos = new Archivos();
            oArchivos.Extension = "xml";
            oArchivos.Nombre = "xl/charts/chart1";
            oArchivos.FileBytes = new byte[] { };
            LstArchivos.Add(oArchivos);

            //string sArchivoXlChartSheet = Path.Combine(sDirectorioXlChartSheets, "sheet1.xml");

            oArchivos = new Archivos();
            oArchivos.Extension = "xml";
            oArchivos.Nombre = "xl/chartsheets/_rels/sheet1";
            oArchivos.FileBytes = new byte[] { };
            LstArchivos.Add(oArchivos);

            // string sArchivoXlChartSheetRel = Path.Combine(sDirectorioXlChartSheetsRel, "sheet1.xml.rels");

            oArchivos = new Archivos();
            oArchivos.Extension = "rels";
            oArchivos.Nombre = "xl/chartsheets/_rels/sheet1.xml";
            oArchivos.FileBytes = new byte[] { };
            LstArchivos.Add(oArchivos);

            // string sArchivoXlDrawing = Path.Combine(sDirectorioXlDrawings, "drawing1.xml");

            oArchivos = new Archivos();
            oArchivos.Extension = "xml";
            oArchivos.Nombre = "xl/drawings/drawing1";
            oArchivos.FileBytes = new byte[] { };
            LstArchivos.Add(oArchivos);

            //string sArchivoXlDrawingRel = Path.Combine(sDirectorioXlDrawings, "drawing1.xml.rels");

            oArchivos = new Archivos();
            oArchivos.Extension = "rels";
            oArchivos.Nombre = "xl/drawings/drawing1.xml";
            oArchivos.FileBytes = new byte[] { };
            LstArchivos.Add(oArchivos);


            //Crear los Directorios definidos
            //DirectoryInfo oDirectorioRaiz = Directory.CreateDirectory(sDirectorioRaiz);
            //oDirectorioRaiz.CreateSubdirectory("_rels");
            //oDirectorioRaiz.CreateSubdirectory("docProps");
            //DirectoryInfo oDirectorioXl = oDirectorioRaiz.CreateSubdirectory("xl");
            //oDirectorioXl.CreateSubdirectory("_rels");
            //oDirectorioXl.CreateSubdirectory("theme");
            //oDirectorioXl.CreateSubdirectory("worksheets");

            int posArchivo = -1;
            //Crear los Archivos definidos
            //File.WriteAllText(sArchivoContentTypes, getContentTypes());
            posArchivo = buscarArchivo("[Content_Types]");
            if (posArchivo > -1)
            {
                LstArchivos[posArchivo].FileBytes = Encoding.UTF8.GetBytes(getContentTypes());
            }

            // File.WriteAllText(sArchivoRels, getRels());
            posArchivo = buscarArchivo("_rels/");
            if (posArchivo > -1)
            {
                LstArchivos[posArchivo].FileBytes = Encoding.UTF8.GetBytes(getRels());
            }


            //File.WriteAllText(sArchivoDocApp, getApp());

            posArchivo = buscarArchivo("docProps/app");
            if (posArchivo > -1)
            {
                LstArchivos[posArchivo].FileBytes = Encoding.UTF8.GetBytes(getApp());
            }


            // File.WriteAllText(sArchivoDocCore, getCore());

            posArchivo = buscarArchivo("docProps/core");
            if (posArchivo > -1)
            {
                LstArchivos[posArchivo].FileBytes = Encoding.UTF8.GetBytes(getCore());
            }

            // File.WriteAllText(sArchivoXlStyles, getXlStyles());

            posArchivo = buscarArchivo("xl/styles");
            if (posArchivo > -1)
            {
                LstArchivos[posArchivo].FileBytes = Encoding.UTF8.GetBytes(getXlStyles());
            }


            //File.WriteAllText(sArchivoXlWorkbook, getXlWorkbook());

            posArchivo = buscarArchivo("xl/workbook");
            if (posArchivo > -1)
            {
                LstArchivos[posArchivo].FileBytes = Encoding.UTF8.GetBytes(getXlWorkbook());
            }

            // File.WriteAllText(sArchivoXlRels, getXlRels());
            posArchivo = buscarArchivo("xl/_rels/workbook.xml");
            if (posArchivo > -1)
            {
                LstArchivos[posArchivo].FileBytes = Encoding.UTF8.GetBytes(getXlRels());
            }

            //File.WriteAllText(sArchivoXlTheme, getXlTheme());

            posArchivo = buscarArchivo("xl/theme/theme1");
            if (posArchivo > -1)
            {
                LstArchivos[posArchivo].FileBytes = Encoding.UTF8.GetBytes(getXlTheme());
            }

            MemoryStream oMemoryStream;
            for (var i = 0; i < nHojas; i++)
            {
                //getXlSheet(sArchivoXlSheets[i], i);

                posArchivo = buscarArchivo(String.Format("xl/worksheets/sheet{0}", i + 1));
                if (posArchivo > -1)
                {
                    oMemoryStream = new MemoryStream();
                    getXlSheet(oMemoryStream, i);
                    LstArchivos[posArchivo].FileBytes = oMemoryStream.ToArray();
                }

            }

            //Si el archivo ya existe entonces borrar
            //if (File.Exists(sArchivoXlsx)) File.Delete(sArchivoXlsx);
            //Comprimir los archivos en un Xlsx
            //ZipFile.CreateFromDirectory(sDirectorioRaiz, sArchivoXlsx);
            //Borrar todo el directorio con los archivos temporales creados
            //Directory.Delete(sDirectorioRaiz, true);

            byte[] fileBytes = null;

            // create a working memory stream
            using (System.IO.MemoryStream memoryStream = new System.IO.MemoryStream())
            {
                // create a zip
                using (System.IO.Compression.ZipArchive zip = new System.IO.Compression.ZipArchive(memoryStream, System.IO.Compression.ZipArchiveMode.Create, true))
                {
                    // interate through the source files
                    foreach (Archivos f in LstArchivos)
                    {
                        // add the item name to the zip
                        System.IO.Compression.ZipArchiveEntry zipItem = zip.CreateEntry(f.Nombre + "." + f.Extension);
                        // add the item bytes to the zip entry by opening the original file and copying the bytes
                        using (System.IO.MemoryStream originalFileMemoryStream = new System.IO.MemoryStream(f.FileBytes))
                        {
                            using (System.IO.Stream entryStream = zipItem.Open())
                            {
                                originalFileMemoryStream.CopyTo(entryStream);
                            }
                        }
                    }
                }
                fileBytes = memoryStream.ToArray();
            }

            return fileBytes;

        }

        private string getContentTypes()
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

        private string getRels()
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

        private string getApp()
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

        private string getCore()
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

        private string getXlStyles()
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("<styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">");

            sb.Append("<numFmts count='2'>");
            sb.Append("<numFmt numFmtId='164' formatCode='dd/mm/yyyy'/>");
            sb.Append("<numFmt numFmtId='165' formatCode='dd/mm/yyyy hh:mm:ss'/>");
            sb.Append("</numFmts>");

            sb.Append("<fonts count=\"2\">");
            sb.Append("<font>");
            sb.Append("<sz val=\"11\"/>");
            sb.Append("<color theme=\"1\"/>");
            sb.Append("<name val=\"MS Sans Serif\"/>");
            sb.Append("<family val=\"2\"/>");
            sb.Append("<scheme val=\"minor\"/>");
            sb.Append("</font>");
            sb.Append("<font>");
            sb.Append("<b/>");
            sb.Append("<sz val=\"11\"/>");
            sb.Append("<color rgb=\"FFFFFFFF\"/>");
            sb.Append("<name val=\"MS Sans Serif\"/>");
            sb.Append("<family val=\"2\"/>");
            sb.Append("</font>");
            sb.Append("</fonts>");

            sb.Append("<fills count=\"3\">");
            sb.Append("<fill><patternFill patternType=\"none\"/></fill>");
            sb.Append("<fill><patternFill patternType=\"gray125\"/></fill>");
            sb.Append("<fill>");
            sb.Append("<patternFill patternType=\"solid\">");
            sb.Append("<fgColor rgb=\"FFCC0C2F\"/>");
            sb.Append("<bgColor indexed=\"64\"/>");
            sb.Append("</patternFill>");
            sb.Append("</fill>");
            sb.Append("</fills>");

            sb.Append("<borders count=\"1\">");
            sb.Append("<border><left/><right/><top/><bottom/><diagonal/></border>");
            sb.Append("</borders>");
            sb.Append("<cellStyleXfs count=\"1\">");
            sb.Append("<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/>");

            sb.Append("</cellStyleXfs>");
            sb.Append("<cellXfs count=\"4\">");
            sb.Append("<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/>");
            sb.Append("<xf numFmtId=\"0\" fontId=\"1\" fillId=\"2\" borderId=\"0\" xfId=\"0\" applyFill=\"1\" applyFont=\"1\"/>");
            sb.Append("<xf numFmtId=\"164\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyNumberFormat=\"1\"/>");
            sb.Append("<xf numFmtId=\"165\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyNumberFormat=\"1\"/>");
            sb.Append("</cellXfs>");

            sb.Append("<cellStyles count=\"1\">");
            sb.Append("<cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/>");
            sb.Append("</cellStyles>");
            sb.Append("<dxfs count=\"0\"/>");
            sb.Append("<tableStyles count=\"0\" defaultTableStyle=\"TableStyleMedium9\" defaultPivotStyle=\"PivotStyleLight16\"/>");
            sb.Append("</styleSheet>");
            return sb.ToString();
        }

        private string getXlWorkbook()
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

        private string getXlRels()
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

        private string getXlTheme()
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

        private void getXlSheet(MemoryStream ms, int nHoja)
        {
            using (StreamWriter sw = new StreamWriter(ms))
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

        private void getSheetTable(StreamWriter sw, int nHoja)
        {
            var tabla = data[nHoja];
            DataColumnCollection campos = tabla.Columns;
            //using (StreamWriter sw = new StreamWriter(ms))
            //{
            sw.Write(String.Format("<row outlineLevel=\"0\" r=\"{0}\">", indiceY + 1));
            string celda;
            string valor;
            string tipo;
            object dato;
            DateTime fecha;
            for (int j = 0; j < campos.Count; j++)
            {
                celda = String.Format("{0}{1}", (char)(65 + j + indiceX), indiceY + 1);
                valor = campos[j].ColumnName;
                sw.Write("<c r=\"");
                sw.Write(celda);
                sw.Write("\" s=\"1\" t=\"inlineStr\"><is><t>");
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

                    dato = tabla.Rows[i][j];
                    tipo = campos[j].DataType.ToString();

                    if (dato == DBNull.Value)
                    {
                        valor = "";
                    }
                    else if (campos[j].DataType == typeof(DateTime))
                    {
                        valor = ((DateTime)dato).ToOADate().ToString(System.Globalization.CultureInfo.InvariantCulture);
                    }
                    else if (campos[j].DataType == typeof(decimal) || campos[j].DataType == typeof(double) || campos[j].DataType == typeof(float))
                    {
                        valor = Convert.ToString(dato,System.Globalization.CultureInfo.InvariantCulture);
                    }
                    else
                    {
                        valor = dato.ToString();
                    }

                    sw.Write("<c r=\"");
                    sw.Write(celda);

                    if (dato == DBNull.Value)
                    {
                        sw.Write("\" s=\"0\"");
                        sw.Write("></c>");
                        continue;
                    }
                    else
                    {
                        if (tipo.Contains("DateTime"))
                        {
                            fecha = (DateTime)tabla.Rows[i][j];

                            if (fecha.TimeOfDay == TimeSpan.Zero)
                                sw.Write("\" s=\"2\"");
                            else
                                sw.Write("\" s=\"3\"");
                        }
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
                }
                sw.Write("</row>");

            }
            //}
        }

        private int buscarArchivo(string nombre)
        {
            int narchivos = LstArchivos.Count;
            Archivos oArchivo;
            int pos = -1;
            for (int i = 0; i < narchivos; i++)
            {
                oArchivo = LstArchivos[i];
                if (oArchivo.Nombre.Equals(nombre))
                {
                    pos = i;
                    break;
                }
            }
            return pos;
        }
    }
    public class Archivos
    {
        public string Nombre { get; set; }
        public string Extension { get; set; }
        public Byte[] FileBytes { get; set; }
    }

}