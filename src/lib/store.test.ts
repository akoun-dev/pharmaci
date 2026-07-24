import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore, type CartItem, type AuthUser } from "./store";

// Helper to create a test cart item
function createCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    medicationId: "med-1",
    medicationName: "Doliprane",
    medicationDosage: "500mg",
    medicationForm: "Comprimé",
    pharmacyId: "pharm-1",
    pharmacyName: "Pharmacie Centrale",
    unitPrice: 1500,
    quantity: 2,
    prescriptionRequired: false,
    ...overrides,
  };
}

// Helper to create a test user
function createUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "user-1",
    name: "Jean Dupont",
    email: "jean@example.com",
    role: "PATIENT",
    ...overrides,
  };
}

describe("Store - Auth", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAppStore.setState({
      user: null,
      cart: [],
      nav: { tab: "home", view: "home", params: {}, history: [] },
      onboardingDone: false,
      guestMode: false,
      recentlyViewed: [],
      recentSearches: [],
      userPosition: null,
      notificationCount: 0,
      toastQueue: [],
    });
  });

  it("starts with null user", () => {
    const { user } = useAppStore.getState();
    expect(user).toBeNull();
  });

  it("setUser updates the user", () => {
    const testUser = createUser();
    useAppStore.getState().setUser(testUser);
    expect(useAppStore.getState().user).toEqual(testUser);
  });

  it("setUser with null clears the user", () => {
    useAppStore.getState().setUser(createUser());
    useAppStore.getState().setUser(null);
    expect(useAppStore.getState().user).toBeNull();
  });

  it("logout clears user and cart and resets nav", () => {
    useAppStore.getState().setUser(createUser());
    useAppStore.getState().addToCart(createCartItem());
    useAppStore.getState().logout();

    const state = useAppStore.getState();
    expect(state.user).toBeNull();
    expect(state.cart).toHaveLength(0);
    expect(state.nav.tab).toBe("home");
  });
});

describe("Store - Cart", () => {
  beforeEach(() => {
    useAppStore.setState({ cart: [] });
  });

  it("starts with empty cart", () => {
    expect(useAppStore.getState().cart).toHaveLength(0);
  });

  it("addToCart adds an item", () => {
    const item = createCartItem();
    useAppStore.getState().addToCart(item);
    expect(useAppStore.getState().cart).toHaveLength(1);
  });

  it("addToCart increments quantity for duplicate items", () => {
    const item = createCartItem({ quantity: 2 });
    useAppStore.getState().addToCart(item);
    useAppStore.getState().addToCart(item);

    const cart = useAppStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(4);
  });

  it("addToCart creates separate entries for different pharmacies", () => {
    const item1 = createCartItem({ pharmacyId: "pharm-1" });
    const item2 = createCartItem({ pharmacyId: "pharm-2", medicationId: "med-1" });

    useAppStore.getState().addToCart(item1);
    useAppStore.getState().addToCart(item2);

    expect(useAppStore.getState().cart).toHaveLength(2);
  });

  it("updateCartQuantity updates item quantity", () => {
    useAppStore.getState().addToCart(createCartItem());
    useAppStore.getState().updateCartQuantity("med-1", "pharm-1", 5);

    expect(useAppStore.getState().cart[0].quantity).toBe(5);
  });

  it("updateCartQuantity removes item when quantity is 0", () => {
    useAppStore.getState().addToCart(createCartItem());
    useAppStore.getState().updateCartQuantity("med-1", "pharm-1", 0);

    expect(useAppStore.getState().cart).toHaveLength(0);
  });

  it("removeFromCart removes the specific item", () => {
    useAppStore.getState().addToCart(createCartItem());
    useAppStore.getState().removeFromCart("med-1", "pharm-1");

    expect(useAppStore.getState().cart).toHaveLength(0);
  });

  it("clearCart empties the cart", () => {
    useAppStore.getState().addToCart(createCartItem());
    useAppStore.getState().addToCart(createCartItem({ medicationId: "med-2" }));
    useAppStore.getState().clearCart();

    expect(useAppStore.getState().cart).toHaveLength(0);
  });

  it("cartTotal sums all items", () => {
    useAppStore.getState().addToCart(createCartItem({ unitPrice: 1000, quantity: 2 }));
    useAppStore.getState().addToCart(createCartItem({ medicationId: "med-2", unitPrice: 500, quantity: 3 }));

    expect(useAppStore.getState().cartTotal()).toBe(3500);
  });

  it("cartTotal returns 0 for empty cart", () => {
    expect(useAppStore.getState().cartTotal()).toBe(0);
  });

  it("cartCount sums all quantities", () => {
    useAppStore.getState().addToCart(createCartItem({ quantity: 2 }));
    useAppStore.getState().addToCart(createCartItem({ medicationId: "med-2", quantity: 3 }));

    expect(useAppStore.getState().cartCount()).toBe(5);
  });
});

describe("Store - Navigation", () => {
  beforeEach(() => {
    useAppStore.setState({
      nav: { tab: "home", view: "home", params: {}, history: [] },
    });
  });

  it("starts at home tab", () => {
    expect(useAppStore.getState().nav.tab).toBe("home");
  });

  it("setTab changes the tab", () => {
    useAppStore.getState().setTab("orders");
    expect(useAppStore.getState().nav.tab).toBe("orders");
    expect(useAppStore.getState().nav.view).toBe("orders");
  });

  it("navigate changes view and stores history", () => {
    useAppStore.getState().navigate("medication-detail", { id: "123" });

    const state = useAppStore.getState().nav;
    expect(state.view).toBe("medication-detail");
    expect(state.params).toEqual({ id: "123" });
    expect(state.history).toHaveLength(1);
  });

  it("goBack returns to previous view", () => {
    useAppStore.getState().navigate("medication-detail", { id: "123" });
    useAppStore.getState().goBack();

    const state = useAppStore.getState().nav;
    expect(state.view).toBe("home");
    expect(state.history).toHaveLength(0);
  });

  it("canGoBack returns true when there is history", () => {
    expect(useAppStore.getState().canGoBack()).toBe(false);
    useAppStore.getState().navigate("cart");
    expect(useAppStore.getState().canGoBack()).toBe(true);
  });
});

describe("Store - Onboarding & Guest Mode", () => {
  beforeEach(() => {
    useAppStore.setState({ onboardingDone: false, guestMode: false });
  });

  it("starts with onboarding not done", () => {
    expect(useAppStore.getState().onboardingDone).toBe(false);
  });

  it("setOnboardingDone marks onboarding as done", () => {
    useAppStore.getState().setOnboardingDone();
    expect(useAppStore.getState().onboardingDone).toBe(true);
  });

  it("starts without guest mode", () => {
    expect(useAppStore.getState().guestMode).toBe(false);
  });

  it("setGuestMode changes guest mode", () => {
    useAppStore.getState().setGuestMode(true);
    expect(useAppStore.getState().guestMode).toBe(true);
  });
});

describe("Store - Recently Viewed", () => {
  const med1 = { id: "m1", name: "Doliprane", category: "Antalgiques", dosage: "500mg", form: "Comprimé" };
  const med2 = { id: "m2", name: "Amoxicilline", category: "Antibiotiques", dosage: "250mg", form: "Gélule" };

  beforeEach(() => {
    useAppStore.setState({ recentlyViewed: [] });
  });

  it("adds medications to recently viewed", () => {
    useAppStore.getState().addRecentlyViewed(med1);
    expect(useAppStore.getState().recentlyViewed).toHaveLength(1);
    expect(useAppStore.getState().recentlyViewed[0].id).toBe("m1");
  });

  it("moves duplicate to front", () => {
    useAppStore.getState().addRecentlyViewed(med1);
    useAppStore.getState().addRecentlyViewed(med2);
    useAppStore.getState().addRecentlyViewed(med1);

    const viewed = useAppStore.getState().recentlyViewed;
    expect(viewed).toHaveLength(2);
    expect(viewed[0].id).toBe("m1");
  });

  it("limits to 10 items", () => {
    for (let i = 0; i < 15; i++) {
      useAppStore.getState().addRecentlyViewed({
        id: `m${i}`,
        name: `Med ${i}`,
        category: "Autre",
        dosage: "100mg",
        form: "Comprimé",
      });
    }
    expect(useAppStore.getState().recentlyViewed.length).toBeLessThanOrEqual(10);
  });
});

describe("Store - Recent Searches", () => {
  beforeEach(() => {
    useAppStore.setState({ recentSearches: [] });
  });

  it("adds search terms", () => {
    useAppStore.getState().addRecentSearch("Doliprane");
    expect(useAppStore.getState().recentSearches).toContain("Doliprane");
  });

  it("deduplicates case-insensitive", () => {
    useAppStore.getState().addRecentSearch("Doliprane");
    useAppStore.getState().addRecentSearch("doliprane");

    expect(useAppStore.getState().recentSearches).toHaveLength(1);
  });

  it("moves existing term to front", () => {
    useAppStore.getState().addRecentSearch("Doliprane");
    useAppStore.getState().addRecentSearch("Amox");
    useAppStore.getState().addRecentSearch("Doliprane");

    expect(useAppStore.getState().recentSearches[0]).toBe("Doliprane");
  });

  it("ignores empty terms", () => {
    useAppStore.getState().addRecentSearch("  ");
    expect(useAppStore.getState().recentSearches).toHaveLength(0);
  });

  it("limits to 8 terms", () => {
    for (let i = 0; i < 10; i++) {
      useAppStore.getState().addRecentSearch(`Search ${i}`);
    }
    expect(useAppStore.getState().recentSearches.length).toBeLessThanOrEqual(8);
  });

  it("clearRecentSearches empties the list", () => {
    useAppStore.getState().addRecentSearch("Doliprane");
    useAppStore.getState().clearRecentSearches();
    expect(useAppStore.getState().recentSearches).toHaveLength(0);
  });
});

describe("Store - User Position & Notifications", () => {
  beforeEach(() => {
    useAppStore.setState({ userPosition: null, notificationCount: 0 });
  });

  it("setUserPosition stores coordinates", () => {
    useAppStore.getState().setUserPosition([5.36, -4.01]);
    expect(useAppStore.getState().userPosition).toEqual([5.36, -4.01]);
  });

  it("setNotificationCount updates count", () => {
    useAppStore.getState().setNotificationCount(5);
    expect(useAppStore.getState().notificationCount).toBe(5);
  });
});

describe("Store - Toasts", () => {
  beforeEach(() => {
    useAppStore.setState({ toastQueue: [] });
  });

  it("pushToast adds a toast", () => {
    useAppStore.getState().pushToast("Test message", "success");
    expect(useAppStore.getState().toastQueue).toHaveLength(1);
    expect(useAppStore.getState().toastQueue[0].message).toBe("Test message");
  });

  it("pushToast defaults to info type", () => {
    useAppStore.getState().pushToast("Info message");
    expect(useAppStore.getState().toastQueue[0].type).toBe("info");
  });

  it("dismissToast removes by id", () => {
    useAppStore.getState().pushToast("Message 1");
    useAppStore.getState().pushToast("Message 2");
    const id = useAppStore.getState().toastQueue[0].id;
    useAppStore.getState().dismissToast(id);

    expect(useAppStore.getState().toastQueue).toHaveLength(1);
    expect(useAppStore.getState().toastQueue[0].message).toBe("Message 2");
  });
});
