import * as Contacts from 'expo-contacts';
import { Platform } from 'react-native';

export interface PickedContact {
  id: string;
  name: string;
  phone?: string;
}

export const contactService = {
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const { status } = await Contacts.requestPermissionsAsync();
    return status === 'granted';
  },

  async pickContact(): Promise<PickedContact | null> {
    const allowed = await this.requestPermission();
    if (!allowed) {
      throw new Error('Permití el acceso a los contactos para seleccionar uno.');
    }

    try {
      // Usamos la clase Contact a través del namespace
      const contact = await Contacts.Contact.presentPicker();

      if (!contact) return null;

      // Obtenemos los detalles usando el enum desde el namespace
      const details = await contact.getDetails([
        Contacts.ContactField.FULL_NAME,
        Contacts.ContactField.PHONES,
      ]);

      return {
        id: contact.id,
        name: details.fullName ?? 'Sin nombre',
        phone: details.phones?.[0]?.number,
      };
    } catch (error) {
      console.warn('[contactService] Error picking contact:', error);
      throw new Error('No se pudo abrir la agenda de contactos.');
    }
  },
};