import * as XLSX from 'xlsx';
import { Toddler, Measurement, Posyandu } from '../types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export function exportToExcel(toddlers: Toddler[], measurements: Measurement[], posyandus: Posyandu[]) {
  // 1. Prepare Toddlers Sheet
  const toddlerData = toddlers.map(t => ({
    'NIK': t.nik,
    'Nama': t.name,
    'Posyandu': posyandus.find(p => p.id === t.posyanduId)?.name || '',
    'Tempat Lahir': t.birthPlace,
    'Tanggal Lahir': t.birthDate,
    'Jenis Kelamin': t.gender === 'L' ? 'Laki-laki' : 'Perempuan',
    'BB Lahir (kg)': t.birthWeight,
    'TB Lahir (cm)': t.birthHeight,
    'Nama Bapak': t.fatherName,
    'Nama Ibu': t.motherName,
    'Pekerjaan Bapak': t.fatherJob,
    'Pekerjaan Ibu': t.motherJob,
    'Alamat': t.address
  }));

  // 2. Prepare Measurements Sheet
  const measurementData = measurements.map(m => {
    const toddler = toddlers.find(t => t.id === m.toddlerId);
    return {
      'Tanggal Ukur': m.date,
      'Nama Balita': toddler?.name || 'N/A',
      'NIK Balita': toddler?.nik || 'N/A',
      'Berat Badan (kg)': m.weight,
      'Tinggi Badan (cm)': m.height,
      'LILA (cm)': m.lila,
      'LIKA (cm)': m.lika,
      'Imunisasi': m.immunization,
      'Notes': m.notes || ''
    };
  });

  // 3. Create Workbook
  const wb = XLSX.utils.book_new();
  const wsToddlers = XLSX.utils.json_to_sheet(toddlerData);
  const wsMeasurements = XLSX.utils.json_to_sheet(measurementData);

  XLSX.utils.book_append_sheet(wb, wsToddlers, "Data Balita");
  XLSX.utils.book_append_sheet(wb, wsMeasurements, "Hasil Penimbangan");

  // 4. Generate Filename
  const dateStr = format(new Date(), 'dd-MM-yyyy', { locale: id });
  const filename = `Data_Lensa_Peris_${dateStr}.xlsx`;

  // 5. Download
  XLSX.writeFile(wb, filename);
}
