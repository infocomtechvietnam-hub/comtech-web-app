import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_DISPLAY,
} from '../src/common/permissions';

const prisma = new PrismaClient();
const COST = Number(process.env.BCRYPT_COST ?? 12);

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu COMTECH CRM...');

  // ---------- 1. Roles ----------
  const roleNames = ['admin', 'manager', 'employee', 'hr', 'hr_manager'];
  const roleMap: Record<string, string> = {};
  for (const name of roleNames) {
    const info = ROLE_DISPLAY[name];
    const role = await prisma.role.upsert({
      where: { name },
      update: { displayName: info.displayName, description: info.description },
      create: { name, displayName: info.displayName, description: info.description },
    });
    roleMap[name] = role.id;
  }
  console.log(`✅ Đã tạo ${roleNames.length} vai trò`);

  // ---------- 2. Permissions ----------
  const permMap: Record<string, string> = {};
  for (const p of PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: {
        resource_action_scope: {
          resource: p.resource,
          action: p.action,
          scope: p.scope,
        },
      },
      update: { description: p.description },
      create: {
        resource: p.resource,
        action: p.action,
        scope: p.scope,
        description: p.description,
      },
    });
    permMap[`${p.resource}:${p.action}:${p.scope}`] = perm.id;
  }
  console.log(`✅ Đã tạo ${PERMISSIONS.length} quyền`);

  // ---------- 3. Role → Permissions ----------
  for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap[roleName];
    for (const key of perms) {
      const permissionId = permMap[key];
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }
  console.log('✅ Đã gán quyền cho các vai trò');

  // ---------- 4. Departments ----------
  const deptData = [
    { code: 'DEPT-001', name: 'Phòng Kinh doanh', description: 'Bộ phận kinh doanh & bán hàng' },
    { code: 'DEPT-002', name: 'Phòng Kỹ thuật', description: 'Bộ phận kỹ thuật & triển khai' },
    { code: 'DEPT-003', name: 'Phòng Nhân sự', description: 'Bộ phận nhân sự & hành chính' },
  ];
  const deptMap: Record<string, string> = {};
  for (const d of deptData) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name, description: d.description },
      create: d,
    });
    deptMap[d.code] = dept.id;
  }
  console.log(`✅ Đã tạo ${deptData.length} phòng ban`);

  // ---------- 5. Users + Employees ----------
  const users = [
    { email: 'admin@comtech.vn', password: 'Admin@123456', fullName: 'Nguyễn Văn Quản Trị', role: 'admin', dept: null, title: 'Quản trị hệ thống' },
    { email: 'manager1@comtech.vn', password: 'Manager@123456', fullName: 'Trần Thị Kinh Doanh', role: 'manager', dept: 'DEPT-001', title: 'Trưởng phòng Kinh doanh' },
    { email: 'sales1@comtech.vn', password: 'Sales@123456', fullName: 'Lê Văn Sales Một', role: 'employee', dept: 'DEPT-001', title: 'Nhân viên Kinh doanh' },
    { email: 'sales2@comtech.vn', password: 'Sales@123456', fullName: 'Phạm Thị Sales Hai', role: 'employee', dept: 'DEPT-001', title: 'Nhân viên Kinh doanh' },
    { email: 'sales3@comtech.vn', password: 'Sales@123456', fullName: 'Hoàng Văn Sales Ba', role: 'employee', dept: 'DEPT-001', title: 'Nhân viên Kinh doanh' },
    { email: 'hr@comtech.vn', password: 'Hr@123456', fullName: 'Đỗ Thị Nhân Sự', role: 'hr', dept: 'DEPT-003', title: 'Chuyên viên Nhân sự' },
    { email: 'hr_manager@comtech.vn', password: 'HrManager@123456', fullName: 'Vũ Văn Nhân Sự Trưởng', role: 'hr_manager', dept: 'DEPT-003', title: 'Trưởng phòng Nhân sự' },
    { email: 'manager2@comtech.vn', password: 'Manager@123456', fullName: 'Bùi Thị Kỹ Thuật', role: 'manager', dept: 'DEPT-002', title: 'Trưởng phòng Kỹ thuật' },
    { email: 'tech1@comtech.vn', password: 'Tech@123456', fullName: 'Đặng Văn Kỹ Thuật Một', role: 'employee', dept: 'DEPT-002', title: 'Kỹ sư' },
    { email: 'tech2@comtech.vn', password: 'Tech@123456', fullName: 'Ngô Thị Kỹ Thuật Hai', role: 'employee', dept: 'DEPT-002', title: 'Kỹ sư' },
  ];

  let idx = 1;
  const managerByDept: Record<string, string> = {}; // deptCode -> employeeId (để gán manager)
  for (const u of users) {
    const code = `NV-${String(idx).padStart(4, '0')}`;
    idx += 1;
    const passwordHash = await bcrypt.hash(u.password, COST);
    const departmentId = u.dept ? deptMap[u.dept] : null;

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash,
        isActive: true,
        userRoles: { create: { roleId: roleMap[u.role] } },
        employee: {
          create: {
            code,
            fullName: u.fullName,
            jobTitle: u.title,
            departmentId,
            workEmail: u.email,
            status: 'active',
          },
        },
      },
      include: { employee: true },
    });

    if (u.role === 'manager' && u.dept && user.employee) {
      managerByDept[u.dept] = user.employee.id;
    }
  }
  console.log(`✅ Đã tạo ${users.length} tài khoản + hồ sơ nhân viên`);

  // ---------- 6. Gán trưởng phòng cho phòng ban ----------
  for (const [deptCode, employeeId] of Object.entries(managerByDept)) {
    await prisma.department.update({
      where: { code: deptCode },
      data: { managerId: employeeId },
    });
  }
  // hr_manager làm trưởng phòng nhân sự
  const hrManagerEmp = await prisma.employee.findFirst({
    where: { workEmail: 'hr_manager@comtech.vn' },
  });
  if (hrManagerEmp) {
    await prisma.department.update({
      where: { code: 'DEPT-003' },
      data: { managerId: hrManagerEmp.id },
    });
  }
  console.log('✅ Đã gán trưởng phòng');

  // ---------- 7. Khách hàng mẫu (M2) ----------
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@comtech.vn' },
  });
  const salesEmployees = await prisma.employee.findMany({
    where: { workEmail: { in: ['sales1@comtech.vn', 'sales2@comtech.vn', 'sales3@comtech.vn'] } },
    orderBy: { workEmail: 'asc' },
  });
  const pickSales = (i: number) =>
    salesEmployees.length ? salesEmployees[i % salesEmployees.length].id : null;

  const customerData = [
    {
      name: 'Công ty TNHH Thương mại Minh Anh',
      type: 'company', contactPerson: 'Nguyễn Minh Anh', email: 'contact@minhanh.vn',
      phone: '0901234567', taxCode: '0312345678', website: 'https://minhanh.vn',
      industry: 'Bán lẻ', source: 'website', status: 'active', city: 'TP. Hồ Chí Minh',
      address: '123 Nguyễn Huệ, Quận 1', notes: 'Khách hàng thân thiết, ký hợp đồng thường niên.',
    },
    {
      name: 'Công ty Cổ phần Công nghệ FPT Solutions',
      type: 'company', contactPerson: 'Trần Văn Bình', email: 'binh.tran@fptsolutions.vn',
      phone: '0912345678', taxCode: '0301234567', website: 'https://fptsolutions.vn',
      industry: 'Công nghệ thông tin', source: 'referral', status: 'prospect', city: 'Hà Nội',
      address: '17 Duy Tân, Cầu Giấy', notes: 'Đang thương lượng dự án triển khai CRM.',
    },
    {
      name: 'Nguyễn Thị Cẩm Tú',
      type: 'individual', contactPerson: 'Nguyễn Thị Cẩm Tú', email: 'camtu.nguyen@gmail.com',
      phone: '0923456789', industry: 'Tư vấn', source: 'social', status: 'lead',
      city: 'Đà Nẵng', address: '45 Lê Duẩn, Hải Châu',
    },
    {
      name: 'Công ty TNHH Sản xuất Đại Phát',
      type: 'company', contactPerson: 'Lê Đại Phát', email: 'info@daiphat.com.vn',
      phone: '0934567890', taxCode: '0398765432', industry: 'Sản xuất', source: 'event',
      status: 'active', city: 'Bình Dương', address: 'KCN Sóng Thần, Dĩ An',
      notes: 'Nhà cung cấp linh kiện, hợp tác lâu dài.',
    },
    {
      name: 'Công ty CP Dịch vụ Hoàng Gia',
      type: 'company', contactPerson: 'Phạm Hoàng Gia', email: 'lienhe@hoanggia.vn',
      phone: '0945678901', taxCode: '0311122233', industry: 'Dịch vụ', source: 'cold_call',
      status: 'inactive', city: 'TP. Hồ Chí Minh', address: '78 Cách Mạng Tháng 8, Quận 3',
      notes: 'Tạm ngừng hợp tác do thay đổi nhân sự.',
    },
    {
      name: 'Công ty TNHH Xây dựng Tân Tiến',
      type: 'company', contactPerson: 'Võ Tân Tiến', email: 'contact@tantien.vn',
      phone: '0956789012', taxCode: '0344455566', industry: 'Xây dựng', source: 'website',
      status: 'prospect', city: 'Hà Nội', address: '250 Giải Phóng, Đống Đa',
    },
    {
      name: 'Trần Quốc Khánh',
      type: 'individual', contactPerson: 'Trần Quốc Khánh', email: 'khanh.tran@outlook.com',
      phone: '0967890123', industry: 'Bất động sản', source: 'referral', status: 'lead',
      city: 'TP. Hồ Chí Minh', address: '12 Phú Mỹ Hưng, Quận 7',
    },
    {
      name: 'Công ty CP Giáo dục Ánh Dương',
      type: 'company', contactPerson: 'Đỗ Ánh Dương', email: 'info@anhduong.edu.vn',
      phone: '0978901234', taxCode: '0377788899', website: 'https://anhduong.edu.vn',
      industry: 'Giáo dục', source: 'other', status: 'active', city: 'Cần Thơ',
      address: '99 Trần Hưng Đạo, Ninh Kiều', notes: 'Triển khai hệ thống quản lý học viên.',
    },
  ];

  let custIndex = 0;
  for (const c of customerData) {
    const code = `KH-${String(custIndex + 1).padStart(4, '0')}`;
    await prisma.customer.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name: c.name,
        type: c.type,
        contactPerson: c.contactPerson ?? null,
        email: c.email ?? null,
        phone: c.phone ?? null,
        taxCode: (c as any).taxCode ?? null,
        website: (c as any).website ?? null,
        industry: c.industry ?? null,
        source: c.source ?? null,
        status: c.status,
        city: c.city ?? null,
        address: c.address ?? null,
        notes: (c as any).notes ?? null,
        assignedToId: pickSales(custIndex),
        createdById: adminUser?.id ?? null,
      },
    });
    custIndex++;
  }
  console.log(`✅ Đã tạo ${customerData.length} khách hàng mẫu`);

  console.log('🎉 Seed hoàn tất!');
  console.log('\n📋 Tài khoản mẫu:');
  console.log('   admin@comtech.vn / Admin@123456 (Quản trị viên)');
  console.log('   manager1@comtech.vn / Manager@123456 (Quản lý - Kinh doanh)');
  console.log('   sales1@comtech.vn / Sales@123456 (Nhân viên)');
  console.log('   hr@comtech.vn / Hr@123456 (Nhân sự)\n');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
