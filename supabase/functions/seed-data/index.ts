import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INDIAN_LOCATIONS = [
  { address: "Connaught Place, New Delhi", lat: 28.6315, lng: 77.2167 },
  { address: "Andheri West, Mumbai", lat: 19.1364, lng: 72.8296 },
  { address: "Koramangala, Bangalore", lat: 12.9352, lng: 77.6245 },
  { address: "Salt Lake, Kolkata", lat: 22.5800, lng: 88.4150 },
  { address: "T. Nagar, Chennai", lat: 13.0418, lng: 80.2341 },
  { address: "Banjara Hills, Hyderabad", lat: 17.4156, lng: 78.4347 },
  { address: "Aundh, Pune", lat: 18.5590, lng: 73.8077 },
  { address: "Navrangpura, Ahmedabad", lat: 23.0365, lng: 72.5611 },
  { address: "Gomti Nagar, Lucknow", lat: 26.8563, lng: 80.9920 },
  { address: "C-Scheme, Jaipur", lat: 26.9050, lng: 75.8010 },
  { address: "Aliganj, Lucknow", lat: 26.8950, lng: 80.9462 },
  { address: "Saket, New Delhi", lat: 28.5244, lng: 77.2066 },
  { address: "Powai, Mumbai", lat: 19.1176, lng: 72.9060 },
  { address: "Whitefield, Bangalore", lat: 12.9698, lng: 77.7500 },
  { address: "Gachibowli, Hyderabad", lat: 17.4401, lng: 78.3489 },
  { address: "Hinjewadi, Pune", lat: 18.5912, lng: 73.7390 },
  { address: "Sector 62, Noida", lat: 28.6270, lng: 77.3650 },
  { address: "Electronic City, Bangalore", lat: 12.8458, lng: 77.6712 },
  { address: "Rajarhat, Kolkata", lat: 22.5958, lng: 88.4800 },
  { address: "Adyar, Chennai", lat: 13.0067, lng: 80.2572 },
  { address: "Jubilee Hills, Hyderabad", lat: 17.4325, lng: 78.4073 },
  { address: "Viman Nagar, Pune", lat: 18.5679, lng: 73.9143 },
  { address: "Vaishali Nagar, Jaipur", lat: 26.9124, lng: 75.7439 },
  { address: "Indiranagar, Bangalore", lat: 12.9784, lng: 77.6408 },
  { address: "Satellite, Ahmedabad", lat: 23.0225, lng: 72.5265 },
  { address: "Dwarka, New Delhi", lat: 28.5921, lng: 77.0460 },
  { address: "Bandra West, Mumbai", lat: 19.0596, lng: 72.8295 },
  { address: "Anna Nagar, Chennai", lat: 13.0850, lng: 80.2101 },
  { address: "Hazratganj, Lucknow", lat: 26.8508, lng: 80.9470 },
  { address: "Park Street, Kolkata", lat: 22.5518, lng: 88.3521 },
  { address: "MG Road, Bangalore", lat: 12.9758, lng: 77.6045 },
  { address: "Malad West, Mumbai", lat: 19.1874, lng: 72.8484 },
  { address: "Madhapur, Hyderabad", lat: 17.4484, lng: 78.3908 },
  { address: "Kothrud, Pune", lat: 18.5074, lng: 73.8077 },
  { address: "Gomti Nagar Ext, Lucknow", lat: 26.8400, lng: 81.0200 },
  { address: "Malviya Nagar, Jaipur", lat: 26.8644, lng: 75.8076 },
  { address: "Chandkheda, Ahmedabad", lat: 23.1058, lng: 72.5873 },
  { address: "Rajouri Garden, New Delhi", lat: 28.6492, lng: 77.1231 },
  { address: "Howrah, Kolkata", lat: 22.5958, lng: 88.2636 },
  { address: "Tambaram, Chennai", lat: 12.9249, lng: 80.1000 },
  { address: "Gurugram Sector 29", lat: 28.4595, lng: 77.0266 },
  { address: "Wakad, Pune", lat: 18.5991, lng: 73.7638 },
  { address: "Ameerpet, Hyderabad", lat: 17.4375, lng: 78.4483 },
  { address: "HSR Layout, Bangalore", lat: 12.9116, lng: 77.6389 },
  { address: "Dadar, Mumbai", lat: 19.0178, lng: 72.8478 },
  { address: "Laxmi Nagar, New Delhi", lat: 28.6305, lng: 77.2770 },
  { address: "SG Highway, Ahmedabad", lat: 23.0469, lng: 72.5126 },
  { address: "Siruseri, Chennai", lat: 12.8231, lng: 80.2198 },
  { address: "Rajeev Nagar, Jaipur", lat: 26.9400, lng: 75.7600 },
  { address: "New Town, Kolkata", lat: 22.5922, lng: 88.4847 },
  { address: "Marathahalli, Bangalore", lat: 12.9591, lng: 77.6974 },
  { address: "Thane West, Mumbai", lat: 19.2183, lng: 72.9781 },
  { address: "Secunderabad, Hyderabad", lat: 17.4399, lng: 78.4983 },
  { address: "Nigdi, Pune", lat: 18.6522, lng: 73.7716 },
  { address: "Indira Nagar, Lucknow", lat: 26.8750, lng: 80.9970 },
  { address: "Mansarovar, Jaipur", lat: 26.8710, lng: 75.7624 },
  { address: "Bopal, Ahmedabad", lat: 23.0332, lng: 72.4682 },
  { address: "Vasant Kunj, New Delhi", lat: 28.5197, lng: 77.1576 },
  { address: "Bellandur, Bangalore", lat: 12.9260, lng: 77.6762 },
  { address: "Vashi, Navi Mumbai", lat: 19.0771, lng: 72.9989 },
  { address: "Alwarpet, Chennai", lat: 13.0340, lng: 80.2483 },
  { address: "Kondapur, Hyderabad", lat: 17.4642, lng: 78.3584 },
  { address: "Kalyani Nagar, Pune", lat: 18.5463, lng: 73.9029 },
  { address: "Balewadi, Pune", lat: 18.5768, lng: 73.7698 },
  { address: "Yelahanka, Bangalore", lat: 13.1005, lng: 77.5940 },
  { address: "Kandivali West, Mumbai", lat: 19.2094, lng: 72.8397 },
  { address: "Sector 18, Noida", lat: 28.5700, lng: 77.3219 },
  { address: "Ballygunge, Kolkata", lat: 22.5285, lng: 88.3631 },
  { address: "Habsiguda, Hyderabad", lat: 17.4060, lng: 78.5350 },
  { address: "Pallavaram, Chennai", lat: 12.9675, lng: 80.1521 },
  { address: "Vastrapur, Ahmedabad", lat: 23.0325, lng: 72.5292 },
  { address: "Vidhyadhar Nagar, Jaipur", lat: 26.9500, lng: 75.7850 },
  { address: "Mahanagar, Lucknow", lat: 26.8780, lng: 80.9310 },
  { address: "JP Nagar, Bangalore", lat: 12.9063, lng: 77.5857 },
  { address: "Goregaon West, Mumbai", lat: 19.1663, lng: 72.8494 },
  { address: "Magarpatta, Pune", lat: 18.5155, lng: 73.9267 },
  { address: "Basavanagudi, Bangalore", lat: 12.9416, lng: 77.5741 },
  { address: "Tollygunge, Kolkata", lat: 22.4983, lng: 88.3474 },
  { address: "Velachery, Chennai", lat: 12.9815, lng: 80.2180 },
  { address: "Film Nagar, Hyderabad", lat: 17.4136, lng: 78.4093 },
  { address: "Paldi, Ahmedabad", lat: 23.0131, lng: 72.5607 },
  { address: "Rohini, New Delhi", lat: 28.7495, lng: 77.0565 },
  { address: "Tonk Road, Jaipur", lat: 26.8573, lng: 75.7963 },
  { address: "Aashiana, Lucknow", lat: 26.7921, lng: 80.9465 },
  { address: "Sarjapur Road, Bangalore", lat: 12.9104, lng: 77.6856 },
  { address: "Chembur, Mumbai", lat: 19.0522, lng: 72.9005 },
  { address: "Baner, Pune", lat: 18.5590, lng: 73.7868 },
  { address: "Kukatpally, Hyderabad", lat: 17.4849, lng: 78.4138 },
  { address: "Lake Town, Kolkata", lat: 22.6086, lng: 88.4060 },
  { address: "Porur, Chennai", lat: 13.0382, lng: 80.1568 },
  { address: "Memnagar, Ahmedabad", lat: 23.0483, lng: 72.5460 },
  { address: "Janakpuri, New Delhi", lat: 28.6280, lng: 77.0839 },
  { address: "Raja Park, Jaipur", lat: 26.9066, lng: 75.8151 },
  { address: "Chinhat, Lucknow", lat: 26.8723, lng: 81.0440 },
  { address: "BTM Layout, Bangalore", lat: 12.9166, lng: 77.6101 },
  { address: "Pimpri, Pune", lat: 18.6298, lng: 73.7997 },
  { address: "Jadavpur, Kolkata", lat: 22.4992, lng: 88.3714 },
  { address: "Miyapur, Hyderabad", lat: 17.4965, lng: 78.3578 },
  { address: "Sholinganallur, Chennai", lat: 12.9010, lng: 80.2279 },
];

const CATEGORIES = ["Construction", "Cleaning", "Delivery", "Gardening", "Painting", "Plumbing", "Electrical", "Moving", "Carpentry", "Other"];
const JOB_TYPES = ["gig", "part_time", "full_time", "contract"];
const PAY_TYPES = ["hourly", "daily", "fixed"];
const SKILLS = ["Painting", "Welding", "Driving", "Cooking", "Cleaning", "Plumbing", "Wiring", "Carpentry", "Masonry", "Gardening", "Delivery", "Security", "AC Repair", "Tiling", "Roofing"];
const ROLES_LIST = ["Driver", "Electrician", "Plumber", "Carpenter", "Painter", "Cleaner", "Gardener", "Mason", "Welder", "Mechanic", "Delivery", "Cook", "Security Guard"];

const WORKER_NAMES = [
  "Rajesh Kumar", "Amit Sharma", "Suresh Patel", "Vikram Singh", "Pradeep Yadav",
  "Manoj Gupta", "Sanjay Verma", "Arun Mishra", "Deepak Chauhan", "Ravi Tiwari",
  "Rohit Joshi", "Sandeep Nair", "Kiran Reddy", "Ajay Dubey", "Naveen Pillai",
  "Gaurav Saxena", "Rahul Pandey", "Nitin Deshmukh", "Ashok Meena", "Vivek Rathore",
];

const EMPLOYER_NAMES = [
  "Priya Construction Ltd", "Green Home Services", "QuickMove Logistics", "Urban Clean Co",
  "SkyBuild Infra", "BrightStar Maintenance", "SafeHands Facility", "ProFix Solutions",
  "CityWorks Contractors", "Elite Property Services",
];

const JOB_TITLES_BY_CATEGORY: Record<string, string[]> = {
  Construction: ["Site Laborer Needed", "Foundation Work Helper", "Brick Layer Required", "Construction Helper", "Building Renovation Worker", "Concrete Mixer Operator", "Scaffolding Helper", "Site Supervisor Assistant", "Demolition Worker", "Road Construction Helper"],
  Cleaning: ["Office Deep Cleaning", "Home Cleaning Service", "Post-Construction Cleanup", "Window Cleaning Job", "Carpet Cleaning Helper", "Industrial Cleaning Worker", "Sanitization Expert", "Kitchen Deep Clean", "Bathroom Renovation Clean", "Warehouse Cleaning"],
  Delivery: ["Package Delivery Driver", "Food Delivery Rider", "Furniture Delivery Helper", "Document Courier", "Grocery Delivery Person", "Medicine Delivery", "E-commerce Delivery", "Bulk Goods Transport", "Last Mile Delivery", "Express Courier Service"],
  Gardening: ["Garden Maintenance Worker", "Lawn Mowing Service", "Tree Trimming Helper", "Plant Nursery Worker", "Landscaping Assistant", "Hedge Trimming Job", "Flower Bed Maintenance", "Irrigation Setup Helper", "Garden Design Assistant", "Rooftop Garden Worker"],
  Painting: ["Interior Wall Painter", "Exterior House Painting", "Commercial Building Paint", "Touch-up Painting Job", "Spray Painting Worker", "Texture Painting Expert", "Waterproofing & Paint", "Metal Surface Painter", "Wood Polishing & Paint", "Decorative Wall Painting"],
  Plumbing: ["Pipe Fitting Worker", "Bathroom Plumbing Fix", "Water Tank Installation", "Drain Cleaning Service", "Tap & Faucet Repair", "Sewage Line Worker", "Water Heater Install", "Pipeline Maintenance", "Toilet Repair Service", "Kitchen Plumbing Job"],
  Electrical: ["Wiring Installation Help", "Electrical Panel Repair", "Light Fixture Setup", "Fan Installation Worker", "AC Installation Helper", "Inverter Setup Service", "CCTV Installation", "Generator Maintenance", "Switch Board Repair", "Solar Panel Helper"],
  Moving: ["House Shifting Helper", "Office Relocation Worker", "Furniture Moving Service", "Heavy Lifting Required", "Packing & Moving Help", "Warehouse Loading Worker", "Vehicle Loading Helper", "Storage Unit Organizer", "Apartment Moving Service", "Commercial Moving Job"],
  Carpentry: ["Furniture Assembly Worker", "Door & Window Repair", "Kitchen Cabinet Maker", "Wooden Floor Installation", "Custom Shelf Builder", "Wardrobe Assembly Job", "Wooden Partition Work", "Furniture Polishing", "Roof Beam Repair", "Wooden Staircase Work"],
  Other: ["General Handyman Needed", "Event Setup Helper", "Warehouse Organizer", "Security Guard Needed", "Night Watchman Job", "Reception Assistant", "Parking Attendant", "Errand Runner Needed", "Festival Decoration Help", "Maintenance Worker"],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const createdWorkers: string[] = [];
    const createdEmployers: string[] = [];

    // Create 20 workers
    for (let i = 0; i < 20; i++) {
      const email = `worker${i + 1}@localhire.test`;
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: "Worker@123",
        email_confirm: true,
        user_metadata: { full_name: WORKER_NAMES[i], role: "worker" },
      });
      if (error && error.message?.includes("already been registered")) {
        // Get existing user
        const { data: listData } = await admin.auth.admin.listUsers();
        const existing = listData?.users?.find((u) => u.email === email);
        if (existing) createdWorkers.push(existing.id);
        continue;
      }
      if (error) {
        console.error(`Worker ${i + 1} error:`, error.message);
        continue;
      }
      createdWorkers.push(data.user.id);
    }

    // Create 10 employers
    for (let i = 0; i < 10; i++) {
      const email = `employer${i + 1}@localhire.test`;
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: "Employer@123",
        email_confirm: true,
        user_metadata: { full_name: EMPLOYER_NAMES[i], role: "employer" },
      });
      if (error && error.message?.includes("already been registered")) {
        const { data: listData } = await admin.auth.admin.listUsers();
        const existing = listData?.users?.find((u) => u.email === email);
        if (existing) createdEmployers.push(existing.id);
        continue;
      }
      if (error) {
        console.error(`Employer ${i + 1} error:`, error.message);
        continue;
      }
      createdEmployers.push(data.user.id);
    }

    // Create 10 jobs per employer (100 total) with unique locations
    let locationIndex = 0;
    const jobsToInsert: any[] = [];

    for (const employerId of createdEmployers) {
      for (let j = 0; j < 10; j++) {
        const cat = CATEGORIES[j % CATEGORIES.length];
        const titles = JOB_TITLES_BY_CATEGORY[cat];
        const loc = INDIAN_LOCATIONS[locationIndex % INDIAN_LOCATIONS.length];
        locationIndex++;

        const payMin = randInt(200, 800);
        const payMax = payMin + randInt(100, 500);

        jobsToInsert.push({
          employer_id: employerId,
          title: titles[j % titles.length],
          description: `Looking for a skilled ${cat.toLowerCase()} professional in ${loc.address}. Experience preferred. Immediate joining.`,
          category: cat,
          location_address: loc.address,
          location_lat: loc.lat,
          location_lng: loc.lng,
          pay_min: payMin,
          pay_max: payMax,
          pay_type: pick(PAY_TYPES),
          job_type: pick(JOB_TYPES),
          skills_required: pickN(SKILLS, randInt(2, 4)),
          roles_required: pickN(ROLES_LIST, randInt(1, 2)),
          status: "open",
          vacancies: randInt(1, 5),
        });
      }
    }

    // Insert jobs in batches
    if (jobsToInsert.length > 0) {
      const { error: jobError } = await admin.from("jobs").insert(jobsToInsert);
      if (jobError) {
        console.error("Jobs insert error:", jobError.message);
        return new Response(JSON.stringify({ error: jobError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        workers_created: createdWorkers.length,
        employers_created: createdEmployers.length,
        jobs_created: jobsToInsert.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Seed error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
