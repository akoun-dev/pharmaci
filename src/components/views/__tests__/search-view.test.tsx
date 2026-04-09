import { render, screen, fireEvent } from '@testing-library/react';
import { SearchView } from '../search-view';
import { useAppStore } from '@/store/app-store';

// Mock du store
jest.mock('@/store/app-store');

describe('SearchView - Filtre En Stock', () => {
  const mockSetSearchQuery = jest.fn();
  const mockSelectPharmacy = jest.fn();
  const mockSelectMedication = jest.fn();
  const mockSetCurrentView = jest.fn();

  beforeEach(() => {
    (useAppStore as jest.Mock).mockReturnValue({
      searchQuery: '',
      setSearchQuery: mockSetSearchQuery,
      selectPharmacy: mockSelectPharmacy,
      selectMedication: mockSelectMedication,
      setCurrentView: mockSetCurrentView,
      currentUserId: 'user-123'
    });
  });

  test('devrait afficher le bouton de filtre En Stock', () => {
    render(<SearchView />);

    // Vérifier que le bouton existe
    const stockFilterButton = screen.getByText(/En stock/i);
    expect(stockFilterButton).toBeInTheDocument();

    // Vérifier l'icône PackageCheck
    const icon = screen.getByTestId('package-check-icon');
    expect(icon).toBeInTheDocument();
  });

  test('devrait activer/désactiver le filtre En Stock', () => {
    render(<SearchView />);

    const stockFilterButton = screen.getByText(/En stock/i);

    // Clic initial pour activer
    fireEvent.click(stockFilterButton);
    expect(stockFilterButton).toHaveClass('bg-green-600');

    // Second clic pour désactiver
    fireEvent.click(stockFilterButton);
    expect(stockFilterButton).not.toHaveClass('bg-green-600');
  });

  test('devrait afficher le badge de filtre actif', () => {
    render(<SearchView />);

    const stockFilterButton = screen.getByText(/En stock/i);
    fireEvent.click(stockFilterButton);

    // Vérifier que le badge apparaît
    const activeBadge = screen.getByText(/En stock/i);
    expect(activeBadge).toBeInTheDocument();
    expect(activeBadge).toHaveClass('bg-green-100');
  });
});
