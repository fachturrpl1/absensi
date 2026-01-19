if i use this file or embeded this to my project, then you must follow these rules:
1. use the manual edit and the before after format with line number.
2. to prevent cascade edit from "error while editing file" use the mmanual edit, format: before with code and line number, after with code and line number.
Example:
Perubahan 1: Tutup container grid
File: src/app/schedule/[id]/page.tsx
Before (lines 728–734)
tsx
        </div>
      </div>
    </div>
  )}
                {/* Assign Members to this Schedule */}
  <div className="border rounded-lg p-4 bg-card">
After (lines 728–735)
tsx
        </div>
      </div>
    </div>
  )}
      </div>
                {/* Assign Members to this Schedule */}
  <div className="border rounded-lg p-4 bg-card">
Keterangan:

Baris </div> yang ditambahkan menutup container grid yang dibuka di line ~403:

3. do not use format like this: 

204                           </Avatar>
205                           <div className="min-w-0">
206                             <Link href="#" className="font-medium text-sm hover:underline block truncate">
207                               {p.name}
208                             </Link>
209                           </div>
210                         </div>

4. do not use format like this:

3 import React, { useMemo, useState } from "react"
4 import Link from "next/link"
5 import { Card, CardContent } from "@/components/ui/card"
6 import { Button } from "@/components/ui/button"
7 import { Input } from "@/components/ui/input"
8 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
9 import { Separator } from "@/components/ui/separator"
10 import { Search, Pencil } from "lucide-react"
11 import {
12   Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
13 } from "@/components/ui/dialog"
14 import { Textarea } from "@/components/ui/textarea"
15 import { Switch } from "@/components/ui/switch"
16 import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
17 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
18 import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
19 // end imports

5. do not use format numbering in the front of the code