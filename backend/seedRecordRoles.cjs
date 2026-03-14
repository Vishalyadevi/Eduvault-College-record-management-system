const { Role } = require('./models/index.js');

async function seedRoles() {
    const roles = [
        'SuperAdmin',
        'Admin',
        'Staff',
        'Student',
        'DeptAdmin',
        'AcadamicAdmin',
        'AcademicAdmin',
        'IrAdmin',
        'PgAdmin',
        'NewgenAdmin',
        'PlacementAdmin'
    ];

    for (const roleName of roles) {
        try {
            const [role, created] = await Role.findOrCreate({
                where: { roleName },
                defaults: { status: 'Active' }
            });
            if (created) {
                console.log(`✅ Created role: ${roleName}`);
            } else {
                console.log(`ℹ️ Role already exists: ${roleName}`);
            }
        } catch (error) {
            console.error(`❌ Error creating role ${roleName}:`, error.message);
        }
    }
    process.exit(0);
}

seedRoles();
