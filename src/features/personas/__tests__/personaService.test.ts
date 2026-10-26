import { personaService } from '../personaService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mockear AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => 
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('personaService', () => {
  // Limpiar el storage antes de cada test
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('debe crear la ficha propia automáticamente si no existe', async () => {
    const email = 'test@mail.com';
    const nombre = 'Guille';
    
    const personas = await personaService.list(email, nombre);
    
    expect(personas).toHaveLength(1);
    expect(personas[0].esPropia).toBe(true);
    expect(personas[0].nombre).toBe(nombre);
  });

  it('debe agregar una nueva persona a la lista', async () => {
    const email = 'test@mail.com';
    await personaService.list(email, 'Guille'); // Inicializa la propia
    
    const nueva = await personaService.add(email, 'Mamá', 'Familiar');
    
    expect(nueva.nombre).toBe('Mamá');
    expect(nueva.esPropia).toBe(false);
    
    const personas = await personaService.list(email, 'Guille');
    expect(personas).toHaveLength(2);
  });
});