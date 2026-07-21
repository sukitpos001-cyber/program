let editLogId = null;
let currentLogData = []; 

// 1. โหลดรายชื่อพนักงาน
async function loadEmployees() {
    const { data, error } = await supabaseClient
        .from('employees')
        .select('name')
        .order('name', { ascending: true });

    const select = document.getElementById('empSelect');
    if (error) {
        select.innerHTML = '<option disabled>โหลดข้อมูลไม่สำเร็จ</option>';
        return;
    }

    select.innerHTML = ''; 
    data.forEach(emp => {
        select.innerHTML += `<option value="${emp.name}">${emp.name}</option>`;
    });
}

// 2. READ: ดึงข้อมูลบันทึกการทำงาน
async function fetchData() {
    const { data, error } = await supabaseClient
        .from('gasifier_logs')
        .select('*')
        .order('recorded_at', { ascending: false }); // ใช้ recorded_at ตาม Database
    
    if (error) {
        Swal.fire('เกิดข้อผิดพลาด', error.message, 'error');
        return;
    }
    
    currentLogData = data; 
    const tbody = document.getElementById('logTable');
    tbody.innerHTML = '';
    
    data.forEach(item => {
        const dateObj = item.recorded_at ? new Date(item.recorded_at).toLocaleString('th-TH') : '-';
        const empName = (item.employees && item.employees.length > 0) ? item.employees.join(', ') : '-';
        
        tbody.innerHTML += `
        <tr class="hover:bg-gray-100 transition duration-150 border-b">
            <td class="p-3">${dateObj}</td>
            <td class="p-3">${item.stock_in !== null ? item.stock_in : '-'}</td>
            <td class="p-3">${item.furnace_out !== null ? item.furnace_out : '-'}</td>
            <td class="p-3">${item.charcoal !== null ? item.charcoal : '-'}</td>
            <td class="p-3">${empName}</td>
            <td class="p-3">${item.note || '-'}</td>
            <td class="p-3 text-center">
                <button onclick="prepareEdit('${item.gasifier_id}')" 
                        class="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 mr-1 mb-1">
                    แก้ไข
                </button>
                <button onclick="deleteData('${item.gasifier_id}')" 
                        class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
                    ลบ
                </button>
            </td> 
        </tr>`;
    });
}

// 3. เตรียมข้อมูลลงฟอร์มเมื่อกด "แก้ไข"
function prepareEdit(id) {
    const item = currentLogData.find(log => log.gasifier_id === id);
    if (!item) return;

    editLogId = id;
    
    if (item.recorded_at) {
        let date = new Date(item.recorded_at);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        document.getElementById('logDatetime').value = date.toISOString().slice(0, 16);
    }

    document.getElementById('stockIn').value = item.stock_in !== null ? item.stock_in : '';
    document.getElementById('furnaceOut').value = item.furnace_out !== null ? item.furnace_out : '';
    document.getElementById('charcoal').value = item.charcoal !== null ? item.charcoal : '';
    document.getElementById('logNote').value = item.note !== null ? item.note : '';

    const empSelect = document.getElementById('empSelect');
    for (let i = 0; i < empSelect.options.length; i++) {
        empSelect.options[i].selected = false;
    }
    
    if (item.employees && item.employees.length > 0) {
        for (let i = 0; i < empSelect.options.length; i++) {
            if (item.employees.includes(empSelect.options[i].value)) {
                empSelect.options[i].selected = true;
            }
        }
    }

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.innerText = 'อัปเดตข้อมูล';
    saveBtn.classList.replace('bg-blue-600', 'bg-green-600');
    saveBtn.classList.replace('hover:bg-blue-700', 'hover:bg-green-700');
    
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) cancelBtn.classList.remove('hidden');
}

// 4. ยกเลิกการแก้ไข
function cancelEdit() {
    editLogId = null;
    document.getElementById('logDatetime').value = '';
    document.getElementById('stockIn').value = '';
    document.getElementById('furnaceOut').value = '';
    document.getElementById('charcoal').value = '';
    document.getElementById('logNote').value = '';
    
    const empSelect = document.getElementById('empSelect');
    for (let i = 0; i < empSelect.options.length; i++) {
        empSelect.options[i].selected = false;
    }
    
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.innerText = 'บันทึกข้อมูล';
    saveBtn.classList.replace('bg-green-600', 'bg-blue-600');
    saveBtn.classList.replace('hover:bg-green-700', 'hover:bg-blue-700');
    
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) cancelBtn.classList.add('hidden');
}

// 5. CREATE & UPDATE
async function saveData() {
    const datetime = document.getElementById('logDatetime').value;
    const stock_in = document.getElementById('stockIn').value;
    const furnace_out = document.getElementById('furnaceOut').value;
    const charcoal = document.getElementById('charcoal').value;
    const note = document.getElementById('logNote').value;
    
    const empSelect = document.getElementById('empSelect');
    const selectedEmployees = Array.from(empSelect.selectedOptions).map(option => option.value);
    
    if (!datetime || selectedEmployees.length === 0) {
        Swal.fire('แจ้งเตือน', 'กรุณากรอก วัน-เวลา และเลือกพนักงานอย่างน้อย 1 คน', 'warning');
        return;
    }

    const payload = { 
        recorded_at: datetime, // แมปเข้ากับคอลัมน์ recorded_at
        stock_in: stock_in ? stock_in : null,
        furnace_out: furnace_out ? furnace_out : null,
        charcoal: charcoal ? charcoal : null,
        employees: selectedEmployees, 
        note: note
    };

    if (editLogId) {
        const { error } = await supabaseClient
            .from('gasifier_logs')
            .update(payload)
            .eq('gasifier_id', editLogId); // อ้างอิงด้วย gasifier_id
            
        if (error) {
            Swal.fire('อัปเดตล้มเหลว', error.message, 'error');
        } else {
            Swal.fire('สำเร็จ', 'อัปเดตข้อมูลเรียบร้อย', 'success');
            cancelEdit();
            fetchData();
        }
    } else {
        const { error } = await supabaseClient
            .from('gasifier_logs')
            .insert([payload]);
        
        if (error) {
            Swal.fire('บันทึกล้มเหลว', error.message, 'error');
        } else {
            Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย', 'success');
            cancelEdit();
            fetchData();
        }
    }
}

// 6. DELETE
function deleteData(id) {
    Swal.fire({
        title: 'ยืนยันการลบ?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ลบเลย!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { error } = await supabaseClient.from('gasifier_logs').delete().eq('gasifier_id', id);
            if (error) Swal.fire('ลบล้มเหลว', error.message, 'error');
            else {
                Swal.fire('ลบสำเร็จ!', '', 'success');
                fetchData();
            }
        }
    });
}

async function init() {
    await loadEmployees();
    await fetchData();
}

init();
