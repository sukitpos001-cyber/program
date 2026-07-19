let editEmpId = null;

// 1. READ: ดึงข้อมูลพนักงาน
async function fetchData() {
    const { data, error } = await supabaseClient
        .from('employees')
        .select('*')
        .order('name', { ascending: true });
    
    if (error) {
        Swal.fire('เกิดข้อผิดพลาด', error.message, 'error');
        return;
    }
    
    const tbody = document.getElementById('employeeTable');
    tbody.innerHTML = '';
    
    data.forEach(item => {
        tbody.innerHTML += `
        <tr class="hover:bg-gray-100 transition duration-150 border-b">
            <td class="p-3">${item.name || '-'}</td>
            <td class="p-3">${item.department || '-'}</td>
            <td class="p-3">${item.tel || '-'}</td>
            <td class="p-3">${item.email || '-'}</td>
            <td class="p-3 text-center">
                <button onclick="prepareEdit('${item.employees_id}', '${item.name}', '${item.department}', '${item.tel}', '${item.email}')" 
                        class="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 mr-1">
                    แก้ไข
                </button>
                <button onclick="deleteData('${item.employees_id}')" 
                        class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
                    ลบ
                </button>
            </td> 
        </tr>`;
    });
}

// 2. เตรียมข้อมูลลงฟอร์มเมื่อกด "แก้ไข"
function prepareEdit(id, name, dept, tel, email) {
    editEmpId = id;
    document.getElementById('empName').value = name !== 'null' ? name : '';
    document.getElementById('empDept').value = dept !== 'null' ? dept : '';
    document.getElementById('empTel').value = tel !== 'null' ? tel : '';
    document.getElementById('empEmail').value = email !== 'null' ? email : '';

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.innerText = 'อัปเดตข้อมูล';
    saveBtn.classList.replace('bg-blue-600', 'bg-green-600');
    saveBtn.classList.replace('hover:bg-blue-700', 'hover:bg-green-700');
    
    document.getElementById('cancelBtn').classList.remove('hidden');
}

// 3. ยกเลิกการแก้ไข
function cancelEdit() {
    editEmpId = null;
    document.getElementById('empName').value = '';
    document.getElementById('empDept').value = '';
    document.getElementById('empTel').value = '';
    document.getElementById('empEmail').value = '';
    
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.innerText = 'บันทึกข้อมูล';
    saveBtn.classList.replace('bg-green-600', 'bg-blue-600');
    saveBtn.classList.replace('hover:bg-green-700', 'hover:bg-blue-700');
    
    document.getElementById('cancelBtn').classList.add('hidden');
}

// 4. CREATE & UPDATE
async function saveData() {
    const name = document.getElementById('empName').value;
    const dept = document.getElementById('empDept').value;
    const tel = document.getElementById('empTel').value;
    const email = document.getElementById('empEmail').value;
    
    if (!name) {
        Swal.fire('แจ้งเตือน', 'กรุณากรอกชื่อ-นามสกุลพนักงาน', 'warning');
        return;
    }

    // เตรียมแพ็กเกจข้อมูล
    const payload = { 
        name: name, 
        department: dept, 
        tel: tel ? tel : null, // ถ้าไม่ได้กรอกเบอร์ ให้ส่งเป็นค่าว่างไป (เพื่อรองรับ numeric)
        email: email 
    };

    if (editEmpId) {
        const { error } = await supabaseClient
            .from('employees')
            .update(payload)
            .eq('employees_id', editEmpId);
            
        if (error) {
            Swal.fire('อัปเดตล้มเหลว', error.message, 'error');
        } else {
            Swal.fire('สำเร็จ', 'อัปเดตข้อมูลพนักงานเรียบร้อย', 'success');
            cancelEdit();
            fetchData();
        }
    } else {
        const { error } = await supabaseClient
            .from('employees')
            .insert([payload]);
        
        if (error) {
            Swal.fire('บันทึกล้มเหลว', error.message, 'error');
        } else {
            Swal.fire('สำเร็จ', 'เพิ่มพนักงานใหม่เรียบร้อย', 'success');
            cancelEdit();
            fetchData();
        }
    }
}

// 5. DELETE แบบมี SweetAlert ยืนยัน
function deleteData(id) {
    Swal.fire({
        title: 'ยืนยันการลบ?',
        text: "คุณจะไม่สามารถกู้คืนข้อมูลนี้ได้!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ใช่, ลบเลย!',
        cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { error } = await supabaseClient
                .from('employees')
                .delete()
                .eq('employees_id', id);
                
            if (error) {
                Swal.fire('ลบล้มเหลว', error.message, 'error');
            } else {
                Swal.fire('ลบสำเร็จ!', 'ลบข้อมูลออกจากระบบแล้ว', 'success');
                fetchData();
            }
        }
    });
}

// โหลดข้อมูลเมื่อเปิดหน้า
fetchData();
