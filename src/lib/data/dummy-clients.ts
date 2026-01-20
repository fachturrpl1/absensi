// Dummy Clients Data
export interface Client {
    id: string
    name: string
    budget: string
    autoInvoicing: boolean
    isArchived: boolean
    address?: string
    phone?: string
    emails?: string[]
    website?: string
    createdAt: string
}

export const DUMMY_CLIENTS: Client[] = [
    {
        id: "client-1",
        name: "Patricia",
        budget: "Budget: none",
        autoInvoicing: false,
        isArchived: false,
        address: "123 Main St, Jakarta",
        phone: "+62 812-3456-7890",
        emails: ["patricia@example.com"],
        website: "https://patricia.com",
        createdAt: "2025-01-05"
    },
    {
        id: "client-2",
        name: "Tech Corp",
        budget: "Budget: $50,000/month",
        autoInvoicing: true,
        isArchived: false,
        address: "456 Technology Blvd, Surabaya",
        phone: "+62 821-9876-5432",
        emails: ["contact@techcorp.com", "billing@techcorp.com"],
        website: "https://techcorp.co.id",
        createdAt: "2025-01-10"
    },
    {
        id: "client-3",
        name: "Creative Agency",
        budget: "Budget: $15,000/month",
        autoInvoicing: false,
        isArchived: false,
        address: "789 Design Ave, Bandung",
        phone: "+62 813-5555-6666",
        emails: ["hello@creativeagency.com"],
        website: "https://creativeagency.studio",
        createdAt: "2025-01-12"
    },
    {
        id: "client-4",
        name: "Startup Inc",
        budget: "Budget: $5,000/month",
        autoInvoicing: true,
        isArchived: false,
        address: "321 Innovation Street, Bali",
        phone: "+62 814-7777-8888",
        emails: ["team@startup.inc"],
        createdAt: "2025-01-18"
    },
    {
        id: "client-5",
        name: "Old Client Ltd",
        budget: "Budget: none",
        autoInvoicing: false,
        isArchived: true,
        address: "999 Legacy Road, Yogyakarta",
        phone: "+62 815-1111-2222",
        emails: ["info@oldclient.com"],
        createdAt: "2024-11-20"
    }
]
