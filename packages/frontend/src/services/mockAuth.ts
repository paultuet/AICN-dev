// Service de mock pour l'authentification (solution temporaire)
interface User {
  id: string;
  email: string;
  name: string;
  organization: string;
  role: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  organization: string;
}

// Base de données simulée
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin',
    organization: 'AICN',
    role: 'ADMIN'
  }
];

// Mock des tokens - dans un vrai système, ce serait des JWT
const generateToken = (user: User): string => {
  return `mock-token-${user.id}-${Date.now()}`;
};

const mockAuth = {
  // Login
  login: async (credentials: LoginCredentials): Promise<{token: string, user: User}> => {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Trouver l'utilisateur
    const user = mockUsers.find(u => u.email === credentials.email);
    
    // Simuler l'échec de connexion
    if (!user || credentials.password !== 'password') {
      throw new Error('Invalid email or password');
    }
    
    // Générer et retourner un token
    const token = generateToken(user);
    return { token, user };
  },
  
  // Register
  register: async (data: RegisterCredentials): Promise<{token: string, user: User}> => {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Vérifier si l'utilisateur existe déjà
    if (mockUsers.some(u => u.email === data.email)) {
      throw new Error('Email already in use');
    }
    
    // Créer un nouvel utilisateur
    const newUser: User = {
      id: (mockUsers.length + 1).toString(),
      email: data.email,
      name: data.name,
      organization: data.organization,
      role: 'USER'
    };
    
    // Ajouter à notre base de données simulée
    mockUsers.push(newUser);
    
    // Générer et retourner un token
    const token = generateToken(newUser);
    return { token, user: newUser };
  },
  
  // Récupérer l'utilisateur actuel
  getCurrentUser: (): User | null => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    // Dans un vrai système, on décode le JWT
    // Pour notre mock, on vérifie juste si le token existe
    const userId = token.split('-')[1];
    return mockUsers.find(u => u.id === userId) || null;
  },
  
  // Vérifier si l'utilisateur est authentifié
  isAuthenticated: (): boolean => {
    return localStorage.getItem('authToken') !== null;
  },
  
  // Déconnexion
  logout: (): void => {
    localStorage.removeItem('authToken');
  }
};

export default mockAuth;