import { renderHook, waitFor } from '@testing-library/react';
import { useLowStockAlert } from '../use-low-stock-alert';
import { useAppStore } from '@/store/app-store';
import { useCapacitorNotifications } from '@/hooks/use-capacitor-notifications';

// Mock des dépendances
jest.mock('@/store/app-store');
jest.mock('@/hooks/use-capacitor-notifications');

describe('useLowStockAlert', () => {
  const mockSchedule = jest.fn();
  const mockCurrentPharmacyId = 'pharmacy-123';

  beforeEach(() => {
    // Mock useAppStore
    (useAppStore as jest.Mock).mockReturnValue({
      currentUserId: 'user-123',
      currentPharmacyId: mockCurrentPharmacyId
    });

    // Mock useCapacitorNotifications
    (useCapacitorNotifications as jest.Mock).mockReturnValue({
      schedule: mockSchedule
    });

    // Mock global fetch
    global.fetch = jest.fn() as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  test('devrait vérifier les stocks bas périodiquement', async () => {
    // Mock des données de stock bas
    const mockLowStockItems = [
      {
        id: 'stock-1',
        medication: { name: 'Paracétamol' },
        quantity: 5,
        lowStockAlertSent: false
      },
      {
        id: 'stock-2',
        medication: { name: 'Ibuprofène' },
        quantity: 10,
        lowStockAlertSent: false
      }
    ];

    // Mock fetch pour retourner les stocks bas
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLowStockItems)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

    renderHook(() => useLowStockAlert());

    // Avancer le temps pour déclencher la vérification
    jest.advanceTimersByTime(60 * 60 * 1000);

    await waitFor(() => {
      // Vérifier que fetch a été appelé avec les bons paramètres
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/pharmacies/${mockCurrentPharmacyId}/stocks?lowStock=true&alertSent=false`,
        expect.anything()
      );

      // Vérifier que schedule a été appelé pour chaque stock bas
      expect(mockSchedule).toHaveBeenCalledTimes(2);
      expect(mockSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '⚠️ Stock Bas',
          body: expect.stringContaining('Paracétamol')
        })
      );
      expect(mockSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '⚠️ Stock Bas',
          body: expect.stringContaining('Ibuprofène')
        })
      );

      // Vérifier que les alertes ont été marquées comme envoyées
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/pharmacies/${mockCurrentPharmacyId}/stocks/stock-1/alert`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ lowStockAlertSent: true })
        })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/pharmacies/${mockCurrentPharmacyId}/stocks/stock-2/alert`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ lowStockAlertSent: true })
        })
      );
    });
  });

  test('ne devrait pas vérifier si currentPharmacyId est null', () => {
    (useAppStore as jest.Mock).mockReturnValue({
      currentUserId: 'user-123',
      currentPharmacyId: null
    });

    renderHook(() => useLowStockAlert());

    // Avancer le temps
    jest.advanceTimersByTime(60 * 60 * 1000);

    // Vérifier que fetch n'a pas été appelé
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('devrait gérer les erreurs de fetch', async () => {
    // Mock fetch pour retourner une erreur
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    // Mock console.error pour vérifier qu'il est appelé
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(() => useLowStockAlert());

    // Avancer le temps
    jest.advanceTimersByTime(60 * 60 * 1000);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error checking low stock:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  test('devrait nettoyer l\'intervalle au démontage', () => {
    const { unmount } = renderHook(() => useLowStockAlert());

    // Avancer le temps pour déclencher la vérification
    jest.advanceTimersByTime(60 * 60 * 1000);

    // Démontage du hook
    unmount();

    // Avancer le temps à nouveau
    jest.advanceTimersByTime(60 * 60 * 1000);

    // Vérifier que fetch n'est appelé qu'une fois (avant le démontage)
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
