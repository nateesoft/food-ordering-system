export type Language = 'th' | 'en';

export interface Translations {
  // Header
  header: {
    restaurantName: string;
    orderOnline: string;
    cart: string;
    history: string;
  };

  // Categories
  categories: {
    all: string;
  };

  // Menu Card
  menuCard: {
    addToCart: string;
    specialInstructions: string;
    selectCommonRequests: string;
    selectedRequests: string;
    customInstructions: string;
    diningPreference: string;
    dineIn: string;
    takeaway: string;
    cancel: string;
    confirm: string;
  };

  // Cart
  cart: {
    title: string;
    items: string;
    emptyCart: string;
    emptyCartDesc: string;
    specialRequest: string;
    editRequest: string;
    addRequest: string;
    selectMultiple: string;
    selected: string;
    total: string;
    confirmOrder: string;
    orderSuccess: string;
    save: string;
    cancel: string;
  };

  // Order History
  orderHistory: {
    title: string;
    totalOrders: string;
    noOrders: string;
    startOrdering: string;
    preparing: string;
    completed: string;
    delivered: string;
    legend: string;
  };

  // Floor Plan
  floorPlan: {
    title: string;
    currentTable: string;
    viewMode: string;
    changeTable: string;
    mergeTables: string;
    viewInstruction: string;
    changeInstruction: string;
    mergeInstruction: string;
    restaurantName: string;
    floor: string;
    yourTable: string;
    available: string;
    occupied: string;
    reserved: string;
    mergingTables: string;
    selectedTables: string;
    confirmMerge: string;
    confirmChange: string;
    confirmChangeTo: string;
    mergeNote: string;
  };

  // Floating Menu
  floatingMenu: {
    table: string;
    staff: string;
    utensils: string;
    payment: string;
    callStaff: string;
    requestUtensils: string;
    requestPayment: string;
    staffReason: string;
    staffPlaceholder: string;
    selectUtensils: string;
    paymentConfirm: string;
    paymentNote: string;
    requestSent: string;
  };

  // Utensils
  utensils: {
    chopsticks: string;
    spoon: string;
    fork: string;
    knife: string;
    teaspoon: string;
    straw: string;
    tissue: string;
    water: string;
    ice: string;
  };

  // Common Instructions
  commonInstructions: {
    verySpicy: string;
    lessSpicy: string;
    noSpicy: string;
    noVegetables: string;
    noCoriander: string;
    sauceSeparate: string;
  };

  // Common
  common: {
    baht: string;
    quantity: string;
    confirm: string;
    cancel: string;
    close: string;
    change: string;
  };

  // Food Categories (for menu items)
  foodCategories: {
    [key: string]: string;
  };
}
