'use client';

import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import pb, { Collections } from '@/lib/pocketbase';
import type { ContactsRecord, InstitutionsRecord } from '@/lib/pocketbase-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Download, FileUp } from 'lucide-react';

interface InstitutionBulkImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImported?: () => void;
}

type ImportError = {
  row: number;
  message: string;
  institutionName?: string;
};

type ImportResult = {
  institutionsCreated: number;
  contactsCreated: number;
  errors: ImportError[];
};

const TEMPLATE_HEADERS = [
  'institution_name',
  'institution_code',
  'national_number',
  'type',
  'status',
  'city',
  'address',
  'website',
  'first_buy_date',
  'contact_name',
  'contact_position',
  'contact_phone',
  'contact_email',
  'contact_status',
  'contact_is_primary',
];

const TEMPLATE_SAMPLE = [
  'PT Contoh Sukses',
  'INST-001',
  '123456789',
  'CSR',
  'New',
  'Jakarta',
  'Jl. Sudirman No. 1',
  'https://contoh.co.id',
  '2025-01-31',
  'Budi Santoso',
  'Head of CSR',
  '08123456789',
  'budi@contoh.co.id',
  'Active',
  'yes',
];

const INSTITUTION_TYPES: NonNullable<InstitutionsRecord['type']>[] = [
  'Yayasan',
  'CSR',
  'Pemerintah',
  'Sekolah',
  'Other',
];

const INSTITUTION_STATUSES: NonNullable<InstitutionsRecord['status']>[] = [
  'New',
  'Existing Customer',
  'Blacklist',
];

const CONTACT_STATUSES: NonNullable<ContactsRecord['status']>[] = ['Active', 'Non Active'];

const FIELD_ALIASES: Record<string, string[]> = {
  institution_name: ['institution_name', 'name', 'institution'],
  institution_code: ['institution_code', 'code'],
  national_number: ['national_number', 'npwp', 'npsn', 'nib'],
  type: ['type'],
  status: ['status'],
  city: ['city'],
  address: ['address'],
  website: ['website', 'url'],
  first_buy_date: ['first_buy_date', 'first_buy', 'first_buying_date'],
  contact_name: ['contact_name', 'contact', 'pic_name'],
  contact_position: ['contact_position', 'position', 'job_title'],
  contact_phone: ['contact_phone', 'phone', 'contact_phone_number'],
  contact_email: ['contact_email', 'contact_mail'],
  contact_status: ['contact_status'],
  contact_is_primary: ['contact_is_primary', 'is_primary', 'primary'],
};

const normalizeHeader = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateValue = (value: unknown) => {
  if (!value) return undefined;
  if (value instanceof Date) return formatDate(value);
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
      return formatDate(date);
    }
  }
  const text = String(value).trim();
  if (!text) return undefined;
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return formatDate(parsed);
  }
  return text;
};

const pickOption = <T extends string>(value: string, options: readonly T[]) => {
  const normalized = normalizeHeader(value).replace(/_/g, '');
  return options.find((option) => normalizeHeader(option).replace(/_/g, '') === normalized);
};

const parseBoolean = (value: string) => {
  const normalized = normalizeHeader(value).replace(/_/g, '');
  if (!normalized) return undefined;
  if (['yes', 'ya', 'y', 'true', '1'].includes(normalized)) return true;
  if (['no', 'n', 'false', '0'].includes(normalized)) return false;
  return undefined;
};

const buildDownload = (buffer: ArrayBuffer, filename: string) => {
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export function InstitutionBulkImportDialog({
  open,
  onClose,
  onImported,
}: InstitutionBulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parsingError, setParsingError] = useState<string | null>(null);

  const hasErrors = Boolean(result?.errors?.length);

  const totalProcessed = useMemo(() => {
    if (!result) return 0;
    return result.institutionsCreated + result.errors.length;
  }, [result]);

  const downloadTemplate = (format: 'xlsx' | 'csv') => {
    const sheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_SAMPLE]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Institutions');

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(sheet);
      buildDownload(new TextEncoder().encode(csv).buffer, 'institutions-import-template.csv');
      return;
    }

    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    buildDownload(buffer, 'institutions-import-template.xlsx');
  };

  const parseFile = async (fileToParse: File) => {
    const arrayBuffer = await fileToParse.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('Sheet tidak ditemukan.');
    }
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];

    if (rows.length < 2) {
      throw new Error('File tidak berisi data.');
    }

    const headerRow = rows[0].map((cell) => normalizeHeader(String(cell || '')));
    const headerIndex = headerRow.reduce<Record<string, number>>((acc, header, index) => {
      if (header) {
        acc[header] = index;
      }
      return acc;
    }, {});

    const resolveIndex = (aliases: string[]) => {
      for (const alias of aliases) {
        const normalized = normalizeHeader(alias);
        if (headerIndex[normalized] !== undefined) {
          return headerIndex[normalized];
        }
      }
      return undefined;
    };

    const getValue = (row: unknown[], aliases: string[]) => {
      const index = resolveIndex(aliases);
      if (index === undefined) return '';
      return row[index] ?? '';
    };

    return { rows: rows.slice(1), getValue };
  };

  const handleImport = async () => {
    if (!file) {
      alert('Pilih file .xlsx atau .csv terlebih dahulu.');
      return;
    }

    setLoading(true);
    setParsingError(null);
    setResult(null);

    try {
      const { rows, getValue } = await parseFile(file);

      let institutionsCreated = 0;
      let contactsCreated = 0;
      const errors: ImportError[] = [];

      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        const rowNumber = i + 2;
        const rowValues = row.map((cell) => String(cell ?? '').trim());

        if (rowValues.every((value) => value === '')) {
          continue;
        }

        const institutionName = String(getValue(row, FIELD_ALIASES.institution_name)).trim();
        if (!institutionName) {
          errors.push({
            row: rowNumber,
            message: 'Institution name wajib diisi.',
          });
          continue;
        }

        const typeValue = String(getValue(row, FIELD_ALIASES.type)).trim();
        const statusValue = String(getValue(row, FIELD_ALIASES.status)).trim();

        const type = typeValue ? pickOption(typeValue, INSTITUTION_TYPES) : undefined;
        const status = statusValue ? pickOption(statusValue, INSTITUTION_STATUSES) : undefined;

        if (typeValue && !type) {
          errors.push({
            row: rowNumber,
            institutionName,
            message: `Type tidak valid: "${typeValue}".`,
          });
          continue;
        }

        if (statusValue && !status) {
          errors.push({
            row: rowNumber,
            institutionName,
            message: `Status tidak valid: "${statusValue}".`,
          });
          continue;
        }

        const payload: Partial<InstitutionsRecord> = {
          name: institutionName,
          code: String(getValue(row, FIELD_ALIASES.institution_code)).trim() || undefined,
          national_number: String(getValue(row, FIELD_ALIASES.national_number)).trim() || undefined,
          type,
          status,
          city: String(getValue(row, FIELD_ALIASES.city)).trim() || undefined,
          address: String(getValue(row, FIELD_ALIASES.address)).trim() || undefined,
          website: String(getValue(row, FIELD_ALIASES.website)).trim() || undefined,
          first_buy_date: parseDateValue(getValue(row, FIELD_ALIASES.first_buy_date)),
        };

        let createdInstitution: InstitutionsRecord | null = null;

        try {
          createdInstitution = await pb
            .collection(Collections.Institutions)
            .create<InstitutionsRecord>(payload);
          institutionsCreated += 1;
        } catch (error: any) {
          errors.push({
            row: rowNumber,
            institutionName,
            message: `Gagal membuat institution: ${error?.message || 'Unknown error'}`,
          });
          continue;
        }

        const contactName = String(getValue(row, FIELD_ALIASES.contact_name)).trim();
        const contactPosition = String(getValue(row, FIELD_ALIASES.contact_position)).trim();
        const contactPhone = String(getValue(row, FIELD_ALIASES.contact_phone)).trim();
        const contactEmail = String(getValue(row, FIELD_ALIASES.contact_email)).trim();
        const contactStatusValue = String(getValue(row, FIELD_ALIASES.contact_status)).trim();
        const contactPrimaryValue = String(getValue(row, FIELD_ALIASES.contact_is_primary)).trim();

        const hasContactInput = [
          contactName,
          contactPosition,
          contactPhone,
          contactEmail,
          contactStatusValue,
          contactPrimaryValue,
        ].some((value) => value.length > 0);

        if (!hasContactInput) {
          continue;
        }

        if (!contactName) {
          errors.push({
            row: rowNumber,
            institutionName,
            message: 'Contact name wajib diisi jika kolom contact lain terisi.',
          });
          continue;
        }

        const contactStatus = contactStatusValue
          ? pickOption(contactStatusValue, CONTACT_STATUSES)
          : undefined;

        if (contactStatusValue && !contactStatus) {
          errors.push({
            row: rowNumber,
            institutionName,
            message: `Contact status tidak valid: "${contactStatusValue}".`,
          });
          continue;
        }

        const contactPayload: Partial<ContactsRecord> = {
          name: contactName,
          position: contactPosition || undefined,
          phone: contactPhone || undefined,
          email: contactEmail || undefined,
          status: contactStatus,
          is_primary: parseBoolean(contactPrimaryValue),
          institution_relation: createdInstitution.id,
        };

        try {
          await pb.collection(Collections.Contacts).create(contactPayload);
          contactsCreated += 1;
        } catch (error: any) {
          errors.push({
            row: rowNumber,
            institutionName,
            message: `Institution dibuat, tapi gagal membuat contact: ${error?.message || 'Unknown error'}`,
          });
        }
      }

      setResult({ institutionsCreated, contactsCreated, errors });
      if (institutionsCreated > 0 && onImported) {
        onImported();
      }
    } catch (error: any) {
      setParsingError(error?.message || 'Gagal membaca file.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    setResult(null);
    setParsingError(null);

    if (!selected) {
      setFile(null);
      return;
    }

    const extension = selected.name.split('.').pop()?.toLowerCase();
    if (!extension || !['xlsx', 'csv'].includes(extension)) {
      alert('Format file tidak didukung. Gunakan .xlsx atau .csv.');
      event.target.value = '';
      setFile(null);
      return;
    }

    setFile(selected);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Import Institutions</DialogTitle>
          <DialogDescription>
            Import institution sekaligus create contact (jika kolom contact diisi).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-3 text-sm text-gray-600">
              <p>
                Gunakan template agar format kolom sesuai. Tips: formatkan kolom phone sebagai
                text agar angka 0 di depan tidak hilang.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate('xlsx')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template (.xlsx)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate('csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template (.csv)
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Kolom wajib: institution_name</Badge>
                <Badge variant="outline">Format tanggal: YYYY-MM-DD</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="bulk-import-file">Pilih File</Label>
            <Input
              id="bulk-import-file"
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileChange}
              disabled={loading}
            />
            {file && (
              <p className="text-xs text-gray-500">
                File: {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            )}
          </div>

          {parsingError && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <span>{parsingError}</span>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Processed: {totalProcessed}</Badge>
                <Badge variant="outline">Institutions: {result.institutionsCreated}</Badge>
                <Badge variant="outline">Contacts: {result.contactsCreated}</Badge>
                <Badge variant={hasErrors ? 'destructive' : 'outline'}>
                  Errors: {result.errors.length}
                </Badge>
              </div>
              {hasErrors && (
                <div className="space-y-2 max-h-48 overflow-auto rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {result.errors.map((error, index) => (
                    <div key={`${error.row}-${index}`}>
                      Row {error.row}
                      {error.institutionName ? ` (${error.institutionName})` : ''}: {error.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Tutup
          </Button>
          <Button type="button" onClick={handleImport} disabled={loading}>
            <FileUp className="h-4 w-4 mr-2" />
            {loading ? 'Mengimpor...' : 'Mulai Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
