// Comprehensive Tamil Nadu Pincodes Database
// All 38 districts with major area pincodes (~250 entries)

export interface TNLocation {
  city: string;
  district: string;
  state: "Tamil Nadu";
  pincode: string;
}

export const TN_PINCODES: TNLocation[] = [
  // 1. Chennai District
  { city: "Chennai GPO", district: "Chennai", state: "Tamil Nadu", pincode: "600001" },
  { city: "Adyar", district: "Chennai", state: "Tamil Nadu", pincode: "600020" },
  { city: "T. Nagar", district: "Chennai", state: "Tamil Nadu", pincode: "600017" },
  { city: "Anna Nagar", district: "Chennai", state: "Tamil Nadu", pincode: "600040" },
  { city: "Velachery", district: "Chennai", state: "Tamil Nadu", pincode: "600042" },
  { city: "Tambaram", district: "Chennai", state: "Tamil Nadu", pincode: "600045" },
  { city: "Porur", district: "Chennai", state: "Tamil Nadu", pincode: "600116" },
  { city: "Sholinganallur", district: "Chennai", state: "Tamil Nadu", pincode: "600119" },
  { city: "Perambur", district: "Chennai", state: "Tamil Nadu", pincode: "600011" },
  { city: "Mylapore", district: "Chennai", state: "Tamil Nadu", pincode: "600004" },
  { city: "Pallavaram", district: "Chennai", state: "Tamil Nadu", pincode: "600043" },
  { city: "Nanganallur", district: "Chennai", state: "Tamil Nadu", pincode: "600061" },
  { city: "Chromepet", district: "Chennai", state: "Tamil Nadu", pincode: "600044" },
  { city: "Guindy", district: "Chennai", state: "Tamil Nadu", pincode: "600032" },
  { city: "Ambattur", district: "Chennai", state: "Tamil Nadu", pincode: "600053" },
  { city: "Madhavaram", district: "Chennai", state: "Tamil Nadu", pincode: "600060" },
  { city: "Kolathur", district: "Chennai", state: "Tamil Nadu", pincode: "600099" },
  { city: "Medavakkam", district: "Chennai", state: "Tamil Nadu", pincode: "600100" },
  { city: "Alandur", district: "Chennai", state: "Tamil Nadu", pincode: "600016" },
  { city: "Nungambakkam", district: "Chennai", state: "Tamil Nadu", pincode: "600034" },

  // 2. Coimbatore District
  { city: "Coimbatore", district: "Coimbatore", state: "Tamil Nadu", pincode: "641001" },
  { city: "Gandhipuram", district: "Coimbatore", state: "Tamil Nadu", pincode: "641012" },
  { city: "RS Puram", district: "Coimbatore", state: "Tamil Nadu", pincode: "641002" },
  { city: "Singanallur", district: "Coimbatore", state: "Tamil Nadu", pincode: "641005" },
  { city: "Saravanampatti", district: "Coimbatore", state: "Tamil Nadu", pincode: "641035" },
  { city: "Peelamedu", district: "Coimbatore", state: "Tamil Nadu", pincode: "641004" },
  { city: "Pollachi", district: "Coimbatore", state: "Tamil Nadu", pincode: "642001" },
  { city: "Mettupalayam", district: "Coimbatore", state: "Tamil Nadu", pincode: "641301" },
  { city: "Sulur", district: "Coimbatore", state: "Tamil Nadu", pincode: "641402" },
  { city: "Annur", district: "Coimbatore", state: "Tamil Nadu", pincode: "641653" },

  // 3. Madurai District
  { city: "Madurai", district: "Madurai", state: "Tamil Nadu", pincode: "625001" },
  { city: "Madurai Melaur", district: "Madurai", state: "Tamil Nadu", pincode: "625106" },
  { city: "Thiruparankundram", district: "Madurai", state: "Tamil Nadu", pincode: "625005" },
  { city: "Anaiyur", district: "Madurai", state: "Tamil Nadu", pincode: "625601" },
  { city: "Usilampatti", district: "Madurai", state: "Tamil Nadu", pincode: "625532" },
  { city: "Melur", district: "Madurai", state: "Tamil Nadu", pincode: "625106" },
  { city: "Vadipatti", district: "Madurai", state: "Tamil Nadu", pincode: "625218" },

  // 4. Tiruchirappalli (Trichy) District
  { city: "Tiruchirappalli", district: "Tiruchirappalli", state: "Tamil Nadu", pincode: "620001" },
  { city: "Srirangam", district: "Tiruchirappalli", state: "Tamil Nadu", pincode: "620006" },
  { city: "Thillai Nagar", district: "Tiruchirappalli", state: "Tamil Nadu", pincode: "620018" },
  { city: "Lalgudi", district: "Tiruchirappalli", state: "Tamil Nadu", pincode: "621601" },
  { city: "Manachanallur", district: "Tiruchirappalli", state: "Tamil Nadu", pincode: "621005" },
  { city: "Musiri", district: "Tiruchirappalli", state: "Tamil Nadu", pincode: "621211" },
  { city: "Thuraiyur", district: "Tiruchirappalli", state: "Tamil Nadu", pincode: "621010" },

  // 5. Salem District
  { city: "Salem", district: "Salem", state: "Tamil Nadu", pincode: "636001" },
  { city: "Attur", district: "Salem", state: "Tamil Nadu", pincode: "636102" },
  { city: "Mettur", district: "Salem", state: "Tamil Nadu", pincode: "636401" },
  { city: "Omalur", district: "Salem", state: "Tamil Nadu", pincode: "636455" },
  { city: "Edappadi", district: "Salem", state: "Tamil Nadu", pincode: "637501" },
  { city: "Gangavalli", district: "Salem", state: "Tamil Nadu", pincode: "636105" },
  { city: "Yercaud", district: "Salem", state: "Tamil Nadu", pincode: "636601" },

  // 6. Tirunelveli District
  { city: "Tirunelveli", district: "Tirunelveli", state: "Tamil Nadu", pincode: "627001" },
  { city: "Palayamkottai", district: "Tirunelveli", state: "Tamil Nadu", pincode: "627002" },
  { city: "Ambasamudram", district: "Tirunelveli", state: "Tamil Nadu", pincode: "627401" },
  { city: "Cheranmahadevi", district: "Tirunelveli", state: "Tamil Nadu", pincode: "627414" },
  { city: "Sankarankovil", district: "Tirunelveli", state: "Tamil Nadu", pincode: "627756" },
  { city: "Tenkasi", district: "Tirunelveli", state: "Tamil Nadu", pincode: "627811" },

  // 7. Thanjavur District
  { city: "Thanjavur", district: "Thanjavur", state: "Tamil Nadu", pincode: "613001" },
  { city: "Kumbakonam", district: "Thanjavur", state: "Tamil Nadu", pincode: "612001" },
  { city: "Pattukkottai", district: "Thanjavur", state: "Tamil Nadu", pincode: "614601" },
  { city: "Orathanadu", district: "Thanjavur", state: "Tamil Nadu", pincode: "614625" },
  { city: "Thiruvidaimarudur", district: "Thanjavur", state: "Tamil Nadu", pincode: "612104" },
  { city: "Peravurani", district: "Thanjavur", state: "Tamil Nadu", pincode: "614804" },

  // 8. Erode District
  { city: "Erode", district: "Erode", state: "Tamil Nadu", pincode: "638001" },
  { city: "Bhavani", district: "Erode", state: "Tamil Nadu", pincode: "638301" },
  { city: "Gobichettipalayam", district: "Erode", state: "Tamil Nadu", pincode: "638452" },
  { city: "Sathyamangalam", district: "Erode", state: "Tamil Nadu", pincode: "638401" },
  { city: "Perundurai", district: "Erode", state: "Tamil Nadu", pincode: "638052" },
  { city: "Anthiyur", district: "Erode", state: "Tamil Nadu", pincode: "638501" },

  // 9. Vellore District
  { city: "Vellore", district: "Vellore", state: "Tamil Nadu", pincode: "632001" },
  { city: "Katpadi", district: "Vellore", state: "Tamil Nadu", pincode: "632007" },
  { city: "Gudiyatham", district: "Vellore", state: "Tamil Nadu", pincode: "632602" },
  { city: "Ambur", district: "Vellore", state: "Tamil Nadu", pincode: "635802" },
  { city: "Vaniyambadi", district: "Vellore", state: "Tamil Nadu", pincode: "635751" },
  { city: "Arakkonam", district: "Vellore", state: "Tamil Nadu", pincode: "631001" },

  // 10. Dindigul District
  { city: "Dindigul", district: "Dindigul", state: "Tamil Nadu", pincode: "624001" },
  { city: "Palani", district: "Dindigul", state: "Tamil Nadu", pincode: "624601" },
  { city: "Oddanchatram", district: "Dindigul", state: "Tamil Nadu", pincode: "624619" },
  { city: "Natham", district: "Dindigul", state: "Tamil Nadu", pincode: "624401" },
  { city: "Kodaikanal", district: "Dindigul", state: "Tamil Nadu", pincode: "624101" },
  { city: "Vedasandur", district: "Dindigul", state: "Tamil Nadu", pincode: "624710" },

  // 11. Kancheepuram District
  { city: "Kancheepuram", district: "Kancheepuram", state: "Tamil Nadu", pincode: "631501" },
  { city: "Sriperumbudur", district: "Kancheepuram", state: "Tamil Nadu", pincode: "602105" },
  { city: "Uthiramerur", district: "Kancheepuram", state: "Tamil Nadu", pincode: "603406" },
  { city: "Walajabad", district: "Kancheepuram", state: "Tamil Nadu", pincode: "631605" },
  { city: "Kundrathur", district: "Kancheepuram", state: "Tamil Nadu", pincode: "600069" },

  // 12. Tiruvallur District
  { city: "Tiruvallur", district: "Tiruvallur", state: "Tamil Nadu", pincode: "602001" },
  { city: "Avadi", district: "Tiruvallur", state: "Tamil Nadu", pincode: "600054" },
  { city: "Poonamallee", district: "Tiruvallur", state: "Tamil Nadu", pincode: "600056" },
  { city: "Tiruttani", district: "Tiruvallur", state: "Tamil Nadu", pincode: "631209" },
  { city: "Gummidipoondi", district: "Tiruvallur", state: "Tamil Nadu", pincode: "601201" },
  { city: "Ennore", district: "Tiruvallur", state: "Tamil Nadu", pincode: "600057" },

  // 13. Cuddalore District
  { city: "Cuddalore", district: "Cuddalore", state: "Tamil Nadu", pincode: "607001" },
  { city: "Chidambaram", district: "Cuddalore", state: "Tamil Nadu", pincode: "608001" },
  { city: "Virudhachalam", district: "Cuddalore", state: "Tamil Nadu", pincode: "606001" },
  { city: "Panruti", district: "Cuddalore", state: "Tamil Nadu", pincode: "607106" },
  { city: "Kattumannarkoil", district: "Cuddalore", state: "Tamil Nadu", pincode: "608301" },

  // 14. Villupuram District
  { city: "Villupuram", district: "Villupuram", state: "Tamil Nadu", pincode: "605602" },
  { city: "Tindivanam", district: "Villupuram", state: "Tamil Nadu", pincode: "604001" },
  { city: "Gingee", district: "Villupuram", state: "Tamil Nadu", pincode: "604202" },
  { city: "Kallakurichi", district: "Villupuram", state: "Tamil Nadu", pincode: "606202" },
  { city: "Ulundurpet", district: "Villupuram", state: "Tamil Nadu", pincode: "606107" },

  // 15. Nagapattinam District
  { city: "Nagapattinam", district: "Nagapattinam", state: "Tamil Nadu", pincode: "611001" },
  { city: "Sirkazhi", district: "Nagapattinam", state: "Tamil Nadu", pincode: "609110" },
  { city: "Mayiladuthurai", district: "Nagapattinam", state: "Tamil Nadu", pincode: "609001" },
  { city: "Vedaranyam", district: "Nagapattinam", state: "Tamil Nadu", pincode: "614810" },
  { city: "Kilvelur", district: "Nagapattinam", state: "Tamil Nadu", pincode: "611112" },

  // 16. Tiruvarur District
  { city: "Tiruvarur", district: "Tiruvarur", state: "Tamil Nadu", pincode: "610001" },
  { city: "Mannargudi", district: "Tiruvarur", state: "Tamil Nadu", pincode: "614001" },
  { city: "Thiruthuraipoondi", district: "Tiruvarur", state: "Tamil Nadu", pincode: "614713" },
  { city: "Nannilam", district: "Tiruvarur", state: "Tamil Nadu", pincode: "610105" },
  { city: "Needamangalam", district: "Tiruvarur", state: "Tamil Nadu", pincode: "614404" },

  // 17. Ramanathapuram District
  { city: "Ramanathapuram", district: "Ramanathapuram", state: "Tamil Nadu", pincode: "623501" },
  { city: "Paramakudi", district: "Ramanathapuram", state: "Tamil Nadu", pincode: "623707" },
  { city: "Rameswaram", district: "Ramanathapuram", state: "Tamil Nadu", pincode: "623526" },
  { city: "Mudukulathur", district: "Ramanathapuram", state: "Tamil Nadu", pincode: "623703" },
  { city: "Kamuthi", district: "Ramanathapuram", state: "Tamil Nadu", pincode: "623604" },

  // 18. Sivaganga District
  { city: "Sivaganga", district: "Sivaganga", state: "Tamil Nadu", pincode: "630561" },
  { city: "Karaikudi", district: "Sivaganga", state: "Tamil Nadu", pincode: "630001" },
  { city: "Devakottai", district: "Sivaganga", state: "Tamil Nadu", pincode: "630302" },
  { city: "Manamadurai", district: "Sivaganga", state: "Tamil Nadu", pincode: "630606" },
  { city: "Ilayangudi", district: "Sivaganga", state: "Tamil Nadu", pincode: "630702" },

  // 19. Virudhunagar District
  { city: "Virudhunagar", district: "Virudhunagar", state: "Tamil Nadu", pincode: "626001" },
  { city: "Sivakasi", district: "Virudhunagar", state: "Tamil Nadu", pincode: "626123" },
  { city: "Srivilliputhur", district: "Virudhunagar", state: "Tamil Nadu", pincode: "626125" },
  { city: "Rajapalayam", district: "Virudhunagar", state: "Tamil Nadu", pincode: "626117" },
  { city: "Aruppukkottai", district: "Virudhunagar", state: "Tamil Nadu", pincode: "626101" },
  { city: "Sattur", district: "Virudhunagar", state: "Tamil Nadu", pincode: "626203" },

  // 20. Theni District
  { city: "Theni", district: "Theni", state: "Tamil Nadu", pincode: "625531" },
  { city: "Periyakulam", district: "Theni", state: "Tamil Nadu", pincode: "625601" },
  { city: "Bodinayakanur", district: "Theni", state: "Tamil Nadu", pincode: "625513" },
  { city: "Uthamapalayam", district: "Theni", state: "Tamil Nadu", pincode: "625533" },
  { city: "Andipatti", district: "Theni", state: "Tamil Nadu", pincode: "625512" },
  { city: "Cumbum", district: "Theni", state: "Tamil Nadu", pincode: "625516" },

  // 21. Thoothukudi (Tuticorin) District
  { city: "Thoothukudi", district: "Thoothukudi", state: "Tamil Nadu", pincode: "628001" },
  { city: "Kovilpatti", district: "Thoothukudi", state: "Tamil Nadu", pincode: "628501" },
  { city: "Tiruchendur", district: "Thoothukudi", state: "Tamil Nadu", pincode: "628215" },
  { city: "Ottapidaram", district: "Thoothukudi", state: "Tamil Nadu", pincode: "628401" },
  { city: "Ettayapuram", district: "Thoothukudi", state: "Tamil Nadu", pincode: "628902" },
  { city: "Srivaikundam", district: "Thoothukudi", state: "Tamil Nadu", pincode: "628619" },

  // 22. Kanyakumari District
  { city: "Nagercoil", district: "Kanyakumari", state: "Tamil Nadu", pincode: "629001" },
  { city: "Marthandam", district: "Kanyakumari", state: "Tamil Nadu", pincode: "629165" },
  { city: "Padmanabhapuram", district: "Kanyakumari", state: "Tamil Nadu", pincode: "629175" },
  { city: "Colachel", district: "Kanyakumari", state: "Tamil Nadu", pincode: "629251" },
  { city: "Kuzhithurai", district: "Kanyakumari", state: "Tamil Nadu", pincode: "629163" },
  { city: "Kanyakumari", district: "Kanyakumari", state: "Tamil Nadu", pincode: "629702" },

  // 23. Namakkal District
  { city: "Namakkal", district: "Namakkal", state: "Tamil Nadu", pincode: "637001" },
  { city: "Tiruchengode", district: "Namakkal", state: "Tamil Nadu", pincode: "637211" },
  { city: "Rasipuram", district: "Namakkal", state: "Tamil Nadu", pincode: "637408" },
  { city: "Paramathi Velur", district: "Namakkal", state: "Tamil Nadu", pincode: "637204" },
  { city: "Kolli Hills", district: "Namakkal", state: "Tamil Nadu", pincode: "637415" },

  // 24. Dharmapuri District
  { city: "Dharmapuri", district: "Dharmapuri", state: "Tamil Nadu", pincode: "636701" },
  { city: "Harur", district: "Dharmapuri", state: "Tamil Nadu", pincode: "636903" },
  { city: "Pappireddipatti", district: "Dharmapuri", state: "Tamil Nadu", pincode: "636905" },
  { city: "Pennagaram", district: "Dharmapuri", state: "Tamil Nadu", pincode: "636811" },
  { city: "Palacode", district: "Dharmapuri", state: "Tamil Nadu", pincode: "636808" },

  // 25. Krishnagiri District
  { city: "Krishnagiri", district: "Krishnagiri", state: "Tamil Nadu", pincode: "635001" },
  { city: "Hosur", district: "Krishnagiri", state: "Tamil Nadu", pincode: "635109" },
  { city: "Denkanikottai", district: "Krishnagiri", state: "Tamil Nadu", pincode: "635107" },
  { city: "Pochampalli", district: "Krishnagiri", state: "Tamil Nadu", pincode: "635205" },
  { city: "Uthangarai", district: "Krishnagiri", state: "Tamil Nadu", pincode: "635207" },

  // 26. Tiruvannamalai District
  { city: "Tiruvannamalai", district: "Tiruvannamalai", state: "Tamil Nadu", pincode: "606601" },
  { city: "Arani", district: "Tiruvannamalai", state: "Tamil Nadu", pincode: "632301" },
  { city: "Polur", district: "Tiruvannamalai", state: "Tamil Nadu", pincode: "606803" },
  { city: "Cheyyar", district: "Tiruvannamalai", state: "Tamil Nadu", pincode: "604407" },
  { city: "Chengam", district: "Tiruvannamalai", state: "Tamil Nadu", pincode: "606701" },
  { city: "Vandavasi", district: "Tiruvannamalai", state: "Tamil Nadu", pincode: "604408" },

  // 27. Pudukkottai District
  { city: "Pudukkottai", district: "Pudukkottai", state: "Tamil Nadu", pincode: "622001" },
  { city: "Aranthangi", district: "Pudukkottai", state: "Tamil Nadu", pincode: "614616" },
  { city: "Alangudi", district: "Pudukkottai", state: "Tamil Nadu", pincode: "622301" },
  { city: "Illupur", district: "Pudukkottai", state: "Tamil Nadu", pincode: "622101" },
  { city: "Thirumayam", district: "Pudukkottai", state: "Tamil Nadu", pincode: "622507" },

  // 28. Perambalur District
  { city: "Perambalur", district: "Perambalur", state: "Tamil Nadu", pincode: "621212" },
  { city: "Kunnam", district: "Perambalur", state: "Tamil Nadu", pincode: "621715" },
  { city: "Veppanthattai", district: "Perambalur", state: "Tamil Nadu", pincode: "621116" },
  { city: "Alathur", district: "Perambalur", state: "Tamil Nadu", pincode: "621707" },

  // 29. Ariyalur District
  { city: "Ariyalur", district: "Ariyalur", state: "Tamil Nadu", pincode: "621713" },
  { city: "Jayankondam", district: "Ariyalur", state: "Tamil Nadu", pincode: "621802" },
  { city: "Sendurai", district: "Ariyalur", state: "Tamil Nadu", pincode: "621714" },
  { city: "Udayarpalayam", district: "Ariyalur", state: "Tamil Nadu", pincode: "621804" },

  // 30. Karur District
  { city: "Karur", district: "Karur", state: "Tamil Nadu", pincode: "639001" },
  { city: "Kulithalai", district: "Karur", state: "Tamil Nadu", pincode: "639104" },
  { city: "Aravakurichi", district: "Karur", state: "Tamil Nadu", pincode: "639201" },
  { city: "Krishnarayapuram", district: "Karur", state: "Tamil Nadu", pincode: "639102" },
  { city: "Pugalur", district: "Karur", state: "Tamil Nadu", pincode: "639113" },

  // 31. The Nilgiris District
  { city: "Ooty (Udhagamandalam)", district: "The Nilgiris", state: "Tamil Nadu", pincode: "643001" },
  { city: "Coonoor", district: "The Nilgiris", state: "Tamil Nadu", pincode: "643101" },
  { city: "Kotagiri", district: "The Nilgiris", state: "Tamil Nadu", pincode: "643217" },
  { city: "Gudalur", district: "The Nilgiris", state: "Tamil Nadu", pincode: "643212" },

  // 32. Tiruppur District
  { city: "Tiruppur", district: "Tiruppur", state: "Tamil Nadu", pincode: "641601" },
  { city: "Avinashi", district: "Tiruppur", state: "Tamil Nadu", pincode: "641654" },
  { city: "Palladam", district: "Tiruppur", state: "Tamil Nadu", pincode: "641664" },
  { city: "Udumalpet", district: "Tiruppur", state: "Tamil Nadu", pincode: "642126" },
  { city: "Dharapuram", district: "Tiruppur", state: "Tamil Nadu", pincode: "638656" },
  { city: "Kangeyam", district: "Tiruppur", state: "Tamil Nadu", pincode: "638701" },

  // 33. Ranipet District
  { city: "Ranipet", district: "Ranipet", state: "Tamil Nadu", pincode: "632401" },
  { city: "Arcot", district: "Ranipet", state: "Tamil Nadu", pincode: "632503" },
  { city: "Walajah", district: "Ranipet", state: "Tamil Nadu", pincode: "632513" },
  { city: "Sholingur", district: "Ranipet", state: "Tamil Nadu", pincode: "631102" },

  // 34. Tirupathur District
  { city: "Tirupathur", district: "Tirupathur", state: "Tamil Nadu", pincode: "635601" },
  { city: "Natrampalli", district: "Tirupathur", state: "Tamil Nadu", pincode: "635852" },
  { city: "Jolarpet", district: "Tirupathur", state: "Tamil Nadu", pincode: "635851" },

  // 35. Chengalpattu District
  { city: "Chengalpattu", district: "Chengalpattu", state: "Tamil Nadu", pincode: "603001" },
  { city: "Mahabalipuram", district: "Chengalpattu", state: "Tamil Nadu", pincode: "603104" },
  { city: "Thiruporur", district: "Chengalpattu", state: "Tamil Nadu", pincode: "603110" },
  { city: "Maduranthakam", district: "Chengalpattu", state: "Tamil Nadu", pincode: "603306" },
  { city: "Kelambakkam", district: "Chengalpattu", state: "Tamil Nadu", pincode: "603103" },

  // 36. Kallakurichi District
  { city: "Kallakurichi", district: "Kallakurichi", state: "Tamil Nadu", pincode: "606202" },
  { city: "Chinnasalem", district: "Kallakurichi", state: "Tamil Nadu", pincode: "606201" },
  { city: "Sankarapuram", district: "Kallakurichi", state: "Tamil Nadu", pincode: "606401" },
  { city: "Tirukoilur", district: "Kallakurichi", state: "Tamil Nadu", pincode: "605757" },

  // 37. Tenkasi District
  { city: "Tenkasi", district: "Tenkasi", state: "Tamil Nadu", pincode: "627811" },
  { city: "Courtallam", district: "Tenkasi", state: "Tamil Nadu", pincode: "627802" },
  { city: "Shencottai", district: "Tenkasi", state: "Tamil Nadu", pincode: "627809" },
  { city: "Kadayanallur", district: "Tenkasi", state: "Tamil Nadu", pincode: "627751" },
  { city: "Alangulam", district: "Tenkasi", state: "Tamil Nadu", pincode: "627851" },

  // 38. Mayiladuthurai District
  { city: "Mayiladuthurai", district: "Mayiladuthurai", state: "Tamil Nadu", pincode: "609001" },
  { city: "Sirkazhi", district: "Mayiladuthurai", state: "Tamil Nadu", pincode: "609110" },
  { city: "Kuthalam", district: "Mayiladuthurai", state: "Tamil Nadu", pincode: "609801" },
  { city: "Tharangambadi", district: "Mayiladuthurai", state: "Tamil Nadu", pincode: "609313" },
];

// Helper to get all unique TN districts
export const TN_DISTRICTS = Array.from(new Set(TN_PINCODES.map(loc => loc.district)));

// Helper to search TN pincodes
export const searchTNPincodes = (query: string): TNLocation[] => {
  const q = query.toLowerCase();
  return TN_PINCODES.filter(
    loc => loc.city.toLowerCase().includes(q) ||
           loc.district.toLowerCase().includes(q) ||
           loc.pincode.includes(q)
  );
};
