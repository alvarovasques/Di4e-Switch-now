import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rtilsdszeimqfcovtruc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWxzZHN6ZWltcWZjb3Z0cnVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTQwMTcsImV4cCI6MjA2MDQ3MDAxN30.w6ivas8Ld5BsrxXcAEvSZUrah7hHcqOvonp04mS6ih4'
);

const users = [
  {
    name: 'Usuário Agente',
    email: 'agent@di4e.com.br',
    password: 'Di4e@2025',
    role: 'agent'
  },
  {
    name: 'Usuário Supervisor',
    email: 'supervisor@di4e.com.br',
    password: 'Di4e@2025',
    role: 'supervisor'
  },
  {
    name: 'Usuário Gerente',
    email: 'manager@di4e.com.br',
    password: 'Di4e@2025',
    role: 'manager'
  },
  {
    name: 'Usuário Administrador',
    email: 'admin@di4e.com.br',
    password: 'Di4e@2025',
    role: 'admin'
  }
];

async function createUsers() {
  for (const user of users) {
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create agent profile
        const { error: profileError } = await supabase
          .from('agents')
          .insert([
            {
              auth_id: authData.user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
          ]);

        if (profileError) throw profileError;

        console.log(`✅ Created ${user.role} user: ${user.email}`);
      }
    } catch (err) {
      console.error(`❌ Failed to create ${user.role} user:`, err);
    }
  }
}

createUsers();