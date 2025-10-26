/**
 * Optimized Icon Exports
 * 
 * Instead of importing all icons from lucide-react, we selectively import only
 * the icons we use. This significantly reduces bundle size.
 * 
 * Usage:
 * import { User, Calendar, CheckCircle } from '@/lib/icons'
 */

// Selective icon exports to reduce bundle size
export {
  // User & Account
  User,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  UserCog,
  
  // Navigation
  Home,
  Menu,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  MoreVertical,
  
  // Actions
  Plus,
  Minus,
  Edit,
  Trash,
  Trash2,
  Save,
  Download,
  Upload,
  RefreshCw,
  RotateCw,
  Copy,
  Check,
  X,
  
  // Status
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Bell,
  BellOff,
  
  // Content
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  
  // Data
  FileText,
  File,
  Folder,
  FolderOpen,
  
  // Communication
  Mail,
  Phone,
  MessageSquare,
  
  // Organization
  Building,
  Building2,
  Briefcase,
  
  // Settings
  Settings,
  Sliders,
  
  // Media
  Image,
  Camera,
  Upload as UploadIcon,
  
  // Misc
  Loader,
  Loader2,
  LogOut,
  LogIn,
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  
  // Charts & Analytics
  BarChart,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  
  // Time & Attendance
  CalendarDays,
  CalendarCheck,
  CalendarX,
  ClockIcon as Clock3,
  
  // Additional common icons
  Zap,
  Star,
  Heart,
  MapPin,
  Link,
  ExternalLink,
  HelpCircle,
} from 'lucide-react'

// Type export for icon props
export type { LucideIcon, LucideProps } from 'lucide-react'
