import fs from 'fs';
import { PDFParse } from 'pdf-parse';

const extractText = async (FilePath) => {
    const buffer = fs.readFileSync(FilePath);
    
    const pdf = new PDFParse({
        data: buffer,
    });

    const result = await pdf.getText();
    return result.text;
}

export default extractText;