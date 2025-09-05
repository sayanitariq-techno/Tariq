
"use client";

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Activity } from '@/types';
import { ActivityList } from './activity-list';
import { EditActivityDialog } from './edit-activity-dialog';
import { Button } from '../ui/button';
import { useMemo, useState } from 'react';
import { Input } from '../ui/input';
import { PlusCircle } from 'lucide-react';

interface PackageDetailTabsProps {
  groupedActivities: Record<string, Activity[]>;
  packageId: string;
}

export function PackageDetailTabs({ groupedActivities, packageId }: PackageDetailTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'grouped';
  const openTag = searchParams.get('openTag');
  const [tagSearchTerm, setTagSearchTerm] = useState('');

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  
  const allActivities = useMemo(() => Object.values(groupedActivities).flat(), [groupedActivities]);
  const sortedTags = useMemo(() => Object.keys(groupedActivities).sort(), [groupedActivities]);

  const filteredTags = useMemo(() => {
    if (!tagSearchTerm) return sortedTags;
    return sortedTags.filter(tag => tag.toLowerCase().includes(tagSearchTerm.toLowerCase()));
  }, [sortedTags, tagSearchTerm]);


  return (
    <Tabs defaultValue={defaultTab} onValueChange={handleTabChange}>
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="grouped">Grouped by Tag</TabsTrigger>
          <TabsTrigger value="all">All Activities ({allActivities.length})</TabsTrigger>
        </TabsList>
        <EditActivityDialog packageId={packageId} />
      </div>
      <TabsContent value="grouped">
         <div className="mb-4 max-w-sm">
            <Input 
                placeholder="Search for a tag..." 
                value={tagSearchTerm}
                onChange={(e) => setTagSearchTerm(e.target.value)}
            />
        </div>
        <Accordion type="multiple" defaultValue={openTag ? [openTag] : (filteredTags.length > 0 ? [filteredTags[0]] : [])} className="w-full">
          {filteredTags.map(tag => {
             const tagActivities = groupedActivities[tag] || [];
             const lastActivity = tagActivities.length > 0
                ? tagActivities.sort((a, b) => new Date(b.plannedEndDate).getTime() - new Date(a.plannedEndDate).getTime())[0]
                : null;
             const defaultStartDate = lastActivity ? new Date(lastActivity.plannedEndDate) : undefined;

            return (
              <AccordionItem value={tag} key={tag}>
                <div className="flex items-center w-full">
                  <AccordionTrigger className="font-semibold text-primary flex-1">
                    <span>{tag} ({groupedActivities[tag].length} {groupedActivities[tag].length === 1 ? 'Activity' : 'Activities'})</span>
                  </AccordionTrigger>
                  <EditActivityDialog packageId={packageId} tag={tag} defaultStartDate={defaultStartDate}>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs mr-2">
                        <PlusCircle className="mr-2 h-4 w-4" /> New Activity
                    </Button>
                  </EditActivityDialog>
                </div>
                <AccordionContent>
                  <ActivityList activities={groupedActivities[tag]} />
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </TabsContent>
      <TabsContent value="all">
         <div className="border rounded-lg">
             <ActivityList activities={allActivities} />
         </div>
      </TabsContent>
    </Tabs>
  );
}
