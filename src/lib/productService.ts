import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from './firebase';
import { Product } from '../app/components/ProductCard';

const PRODUCTS_COLLECTION = 'products';

// Upload image to Firebase Storage
export const uploadProductImage = async (file: File, productId: string): Promise<string> => {
  const storageRef = ref(storage, `products/${productId}/${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

// Upload base64 image to Firebase Storage
export const uploadBase64Image = async (base64String: string, productId: string): Promise<string> => {
  // Convert base64 to blob
  const response = await fetch(base64String);
  const blob = await response.blob();
  
  const storageRef = ref(storage, `products/${productId}/image_${Date.now()}.jpg`);
  await uploadBytes(storageRef, blob);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

// Delete image from Firebase Storage
export const deleteProductImage = async (imageUrl: string): Promise<void> => {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};

// Add new product
export const addProduct = async (productData: Omit<Product, 'id'>, imageFile?: File): Promise<string> => {
  try {
    // Create product document first to get ID
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...productData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // If there's an image file or base64, upload it
    let imageUrl = productData.image;
    if (imageFile) {
      imageUrl = await uploadProductImage(imageFile, docRef.id);
    } else if (productData.image.startsWith('data:')) {
      imageUrl = await uploadBase64Image(productData.image, docRef.id);
    }

    // Update product with image URL if it changed
    if (imageUrl !== productData.image) {
      await updateDoc(doc(db, PRODUCTS_COLLECTION, docRef.id), {
        image: imageUrl,
        updatedAt: Timestamp.now()
      });
    }

    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

// Update existing product
export const updateProduct = async (
  productId: string, 
  productData: Omit<Product, 'id'>, 
  imageFile?: File
): Promise<void> => {
  try {
    let imageUrl = productData.image;

    // If there's a new image, upload it
    if (imageFile) {
      imageUrl = await uploadProductImage(imageFile, productId);
    } else if (productData.image.startsWith('data:')) {
      imageUrl = await uploadBase64Image(productData.image, productId);
    }

    await updateDoc(doc(db, PRODUCTS_COLLECTION, productId), {
      ...productData,
      image: imageUrl,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Delete product
export const deleteProduct = async (productId: string, imageUrl: string): Promise<void> => {
  try {
    // Delete image from storage if it's a Firebase Storage URL
    if (imageUrl.includes('firebasestorage.googleapis.com')) {
      await deleteProductImage(imageUrl);
    }

    // Delete product document
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Get all products
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      products.push({
        id: doc.id,
        name: data.name,
        category: data.category,
        description: data.description,
        price: data.price,
        image: data.image
      });
    });

    return products;
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};
