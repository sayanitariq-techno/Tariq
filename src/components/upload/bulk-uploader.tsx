
"use client";

import { useState, useContext, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { DataContext } from '@/app/actions/data';
import type { Activity, Package, Priority } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileDown, Upload, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ParsedData {
    packages: Package[];
    activities: Activity[];
    errors: string[];
}

export function BulkUploader() {
    const { bulkAddData } = useContext(DataContext);
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);
    const [fileName, setFileName] = useState('');
    const { toast } = useToast();

    const excelDateToJSDate = (serial: number) => {
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;                                        
        const date_info = new Date(utc_value * 1000);
    
        const fractional_day = serial - Math.floor(serial) + 0.0000001;
    
        let total_seconds = Math.floor(86400 * fractional_day);
    
        const seconds = total_seconds % 60;
        total_seconds -= seconds;
    
        const hours = Math.floor(total_seconds / (60 * 60));
        const minutes = Math.floor(total_seconds / 60) % 60;
    
        return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
    }

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                
                const packagesSheet = workbook.Sheets['Packages'];
                const activitiesSheet = workbook.Sheets['Activities'];

                if (!packagesSheet || !activitiesSheet) {
                    toast({
                        title: "Invalid Template",
                        description: "The uploaded file is missing 'Packages' or 'Activities' sheets.",
                        variant: "destructive"
                    });
                    return;
                }

                const rawPackages = XLSX.utils.sheet_to_json(packagesSheet);
                const rawActivities = XLSX.utils.sheet_to_json(activitiesSheet);
                
                const result = parseAndValidateData(rawPackages, rawActivities);
                setParsedData(result);

            } catch (error) {
                console.error("Error parsing Excel file:", error);
                toast({
                    title: "File Read Error",
                    description: "There was an issue reading or parsing the Excel file.",
                    variant: "destructive"
                });
            }
        };

        reader.onerror = () => {
             toast({
                title: "File Read Error",
                description: "Could not read the selected file.",
                variant: "destructive"
            });
        }

        reader.readAsBinaryString(file);
    };

    const parseAndValidateData = (rawPackages: any[], rawActivities: any[]): ParsedData => {
        const packages: Package[] = [];
        const activities: Activity[] = [];
        const errors: string[] = [];
        const packageIds = new Set<string>();

        rawPackages.forEach((row, index) => {
            const { 'Package ID': id, 'Package Name': name, 'Description': description, 'Priority': priority, 'Planned Start Date': startDate, 'Planned End Date': endDate, 'Supervisor': supervisor } = row;
            if (!id || !name || !priority || !startDate || !endDate) {
                errors.push(`Package row ${index + 2}: Missing required fields.`);
                return;
            }
            if (packageIds.has(id)) {
                 errors.push(`Package row ${index + 2}: Duplicate Package ID '${id}'.`);
                return;
            }
            packageIds.add(id);
            packages.push({
                id, name, description, priority: priority as Priority,
                startDate: excelDateToJSDate(startDate),
                endDate: excelDateToJSDate(endDate),
                supervisor: supervisor || undefined,
            });
        });
        
        rawActivities.forEach((row, index) => {
            const { 'Activity ID': id, 'Package ID': packageName, 'Equipment Tag': tag, 'Activity Title': title, 'Priority': priority, 'Planned Start Date': deadline, 'Planned End Date': plannedEndDate, 'Assignee': assignee } = row;
            if (!id || !packageName || !tag || !title || !priority || !deadline || !plannedEndDate) {
                errors.push(`Activity row ${index + 2}: Missing required fields.`);
                return;
            }
            if (!packageIds.has(packageName)) {
                errors.push(`Activity row ${index + 2}: Package ID '${packageName}' not found in the Packages sheet.`);
                return;
            }
            activities.push({
                id, packageName, tag, title, priority: priority as Priority,
                deadline: excelDateToJSDate(deadline),
                plannedEndDate: excelDateToJSDate(plannedEndDate),
                status: 'Not Started',
                assignee: assignee || undefined,
            });
        });

        return { packages, activities, errors };
    }

    const downloadTemplate = useCallback(() => {
        const wb = XLSX.utils.book_new();

        // Packages Sheet
        const packagesData = [
            ["Package ID", "Package Name", "Description", "Priority", "Planned Start Date", "Planned End Date", "Supervisor"],
            ["PKG-EX-01", "Exchanger Maintenance", "Overhaul of primary heat exchangers", "High", 45520.33333, 45525.5, "John Smith"],
            ["PKG-PMP-01", "Pump Refurbishment", "Annual maintenance for all centrifugal pumps", "Medium", 45521.375, 45524.75, "Sarah Johnson"]
        ];
        const packagesWs = XLSX.utils.aoa_to_sheet(packagesData);
        packagesWs['!cols'] = [{wch:15}, {wch:30}, {wch:40}, {wch:10}, {wch:20}, {wch:20}, {wch:20}];
        
        // Apply date formatting hint to Excel for the data rows
        for (let i = 2; i <= packagesData.length; i++) {
            packagesWs[`E${i}`].z = "dd-mmm-yy hh:mm";
            packagesWs[`F${i}`].z = "dd-mmm-yy hh:mm";
        }
        XLSX.utils.book_append_sheet(wb, packagesWs, "Packages");
        
        // Activities Sheet
        const activitiesData = [
             ["Activity ID", "Package ID", "Equipment Tag", "Activity Title", "Priority", "Planned Start Date", "Planned End Date", "Assignee"],
             ["ACT-EX-01-01", "PKG-EX-01", "HE-101A", "Blinding & Isolation", "High", 45520.33333, 45520.41667, "Ops Team"],
             ["ACT-EX-01-02", "PKG-EX-01", "HE-101A", "Dismantle Channel Head", "Medium", 45520.41667, 45520.58333, "Mech Team A"],
             ["ACT-PMP-01-01", "PKG-PMP-01", "P-201", "Electrical Lockout/Tagout", "High", 45521.375, 45521.41667, "Elec Team"],
        ];
        const activitiesWs = XLSX.utils.aoa_to_sheet(activitiesData);
        activitiesWs['!cols'] = [{wch:15}, {wch:15}, {wch:15}, {wch:30}, {wch:10}, {wch:20}, {wch:20}, {wch:15}];
        
        // Apply date formatting hint to Excel for the data rows
        for (let i = 2; i <= activitiesData.length; i++) {
            activitiesWs[`F${i}`].z = "dd-mmm-yy hh:mm";
            activitiesWs[`G${i}`].z = "dd-mmm-yy hh:mm";
        }
        XLSX.utils.book_append_sheet(wb, activitiesWs, "Activities");
        
        XLSX.writeFile(wb, "Bulk_Upload_Template.xlsx");

    }, []);

    const handleConfirmImport = () => {
        if (parsedData && parsedData.packages.length > 0) {
            bulkAddData({ packages: parsedData.packages, activities: parsedData.activities });
            setParsedData(null);
            setFileName('');
        }
    };
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Step 1: Download and Populate Template</CardTitle>
                    <CardDescription>
                        Download the Excel template, fill it with your package and activity data, and then upload it here.
                        Ensure the 'Package ID' in the Activities sheet matches an ID in the Packages sheet. Please use the exact date format shown in the template.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button onClick={downloadTemplate}>
                        <FileDown className="mr-2" />
                        Download Template
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Step 2: Upload Your File</CardTitle>
                    <CardDescription>
                        Select the populated Excel file from your computer to begin the import process.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Input id="upload" type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="max-w-sm" />
                     {fileName && <p className="text-sm text-muted-foreground mt-2">Selected file: {fileName}</p>}
                </CardContent>
            </Card>

            {parsedData && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Step 3: Preview and Confirm</CardTitle>
                        <CardDescription>
                            Review the data extracted from your file. If everything looks correct, confirm the import.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {parsedData.errors.length > 0 && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Validation Errors Found!</AlertTitle>
                                <AlertDescription>
                                    <ul className="list-disc pl-5">
                                        {parsedData.errors.map((error, i) => <li key={i}>{error}</li>)}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}

                         <Tabs defaultValue="packages">
                            <TabsList>
                                <TabsTrigger value="packages">Packages ({parsedData.packages.length})</TabsTrigger>
                                <TabsTrigger value="activities">Activities ({parsedData.activities.length})</TabsTrigger>
                            </TabsList>
                            <TabsContent value="packages">
                                <div className="max-h-[400px] overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Supervisor</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedData.packages.map(p => (
                                            <TableRow key={p.id}>
                                                <TableCell>{p.id}</TableCell>
                                                <TableCell>{p.name}</TableCell>
                                                <TableCell>{p.priority}</TableCell>
                                                <TableCell>{p.supervisor}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </div>
                            </TabsContent>
                            <TabsContent value="activities">
                                <div className="max-h-[400px] overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Package ID</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Tag</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedData.activities.map(a => (
                                            <TableRow key={a.id}>
                                                <TableCell>{a.id}</TableCell>
                                                <TableCell>{a.packageName}</TableCell>
                                                <TableCell>{a.title}</TableCell>
                                                <TableCell>{a.tag}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </div>
                            </TabsContent>
                        </Tabs>

                    </CardContent>
                    <CardFooter>
                         <Button onClick={handleConfirmImport} disabled={parsedData.errors.length > 0 || parsedData.packages.length === 0}>
                            <Upload className="mr-2" />
                            Confirm Import ({parsedData.packages.length} Packages, {parsedData.activities.length} Activities)
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
