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

    // เอา <option> เลือกพนักงานออก เพื่อให้กล่อง Multiple ดูสะอาดตา
    select.innerHTML = ''; 
    data.forEach(emp => {
        select.innerHTML += `<option value="${emp.name}">${emp.name}</option>`;
    });
}

// 2. READ: ดึงข้อมูลบันทึกการทำงาน
async function fetchData() {
    const { data, error } = await supabaseClient
        .from('engine_logs')
        .select('*')
        .order('datetime', { ascending: false });
    
    if (error) {
        Swal.fire('เกิดข้อผิดพลาด', error.message, 'error');
        return;
    }
    
    currentLogData = data; 
    const tbody = document.getElementById('logTable');
    tbody.innerHTML = '';
    
    data.forEach(item => {
        const dateObj = item.datetime ? new Date(item.datetime).toLocaleString('th-TH') : '-';
        
        // แปลง Array รายชื่อพนักงาน ให้กลายเป็นข้อความยาวๆ คั่นด้วยลูกน้ำ
        const empName = (item.employees && item.employees.length > 0) ? item.employees.join(', ') : '-';
        
        tbody.innerHTML += `
        <tr class="hover:bg-gray-100 transition duration-150 border-b">
            <td class="p-3">${dateObj}</td>
            <td class="p-3">${item.e1_kwh || '0'}</td>
            <td class="p-3">${item.e1_h || '0'}</td>
            <td class="p-3">${item.e2_kwh || '0'}</td>
            <td class="p-3">${item.e2_h || '0'}</td>
            <td class="p-3">${empName}</td>
            <td class="p-3">${item.note || '-'}</td>
            <td class="p-3 text-center">
                <button onclick="prepareEdit('${item.engine_id}')" 
                        class="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 mr-1">
                    แก้ไข
                </button>
                <button onclick="deleteData('${item.engine_id}')" 
                        class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
                    ลบ
                </button>
            </td> 
        </tr>`;
    });
}

// 3. เตรียมข้อมูลลงฟอร์มเมื่อกด "แก้ไข"
function prepareEdit(id) {
    const item = currentLogData.find(log => log.engine_id === id);
    if (!item) return;

    editLogId = id;
    
    if (item.datetime) {
        let date = new Date(item.datetime);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        document.getElementById('logDatetime').value = date.toISOString().slice(0, 16);
    }

    document.getElementById('e1Kwh').value = item.e1_kwh !== null ? item.e1_kwh : '';
    document.getElementById('e1H').value = item.e1_h !== null ? item.e1_h : '';
    document.getElementById('e2Kwh').value = item.e2_kwh !== null ? item.e2_kwh : '';
    document.getElementById('e2H').value = item.e2_h !== null ? item.e2_h : '';
    document.getElementById('logNote').value = item.note !== null ? item.note : '';

    // ล้างการเลือกเก่าออกก่อน
    const empSelect = document.getElementById('empSelect');
    for (let i = 0; i < empSelect.options.length; i++) {
        empSelect.options[i].selected = false;
    }
    
    // ไฮไลต์รายชื่อพนักงานทุกคนที่ถูกบันทึกไว้
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
    document.getElementById('e1Kwh').value = '';
    document.getElementById('e1H').value = '';
    document.getElementById('e2Kwh').value = '';
    document.getElementById('e2H').value = '';
    document.getElementById('logNote').value = '';
    
    // ล้างการเลือกรายชื่อพนักงาน
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
    const e1_kwh = document.getElementById('e1Kwh').value;
    const e1_h = document.getElementById('e1H').value;
    const e2_kwh = document.getElementById('e2Kwh').value;
    const e2_h = document.getElementById('e2H').value;
    const note = document.getElementById('logNote').value;
    
    // ดึงค่ารายชื่อที่ถูกเลือกทั้งหมดออกมาเป็น Array
    const empSelect = document.getElementById('empSelect');
    const selectedEmployees = Array.from(empSelect.selectedOptions).map(option => option.value);
    
    if (!datetime || selectedEmployees.length === 0) {
        Swal.fire('แจ้งเตือน', 'กรุณากรอก วัน-เวลา และเลือกพนักงานอย่างน้อย 1 คน', 'warning');
        return;
    }

    const payload = { 
        datetime: datetime,
        e1_kwh: e1_kwh ? e1_kwh : null,
        e1_h: e1_h ? e1_h : null,
        e2_kwh: e2_kwh ? e2_kwh : null,
        e2_h: e2_h ? e2_h : null,
        employees: selectedEmployees, // ส่งตัวแปรที่เป็น Array เข้าไปตรงๆ ได้เลย
        note: note
    };

    if (editLogId) {
        const { error } = await supabaseClient
            .from('engine_logs')
            .update(payload)
            .eq('engine_id', editLogId);
            
        if (error) {
            Swal.fire('อัปเดตล้มเหลว', error.message, 'error');
        } else {
            Swal.fire('สำเร็จ', 'อัปเดตข้อมูลเครื่องยนต์เรียบร้อย', 'success');
            cancelEdit();
            fetchData();
        }
    } else {
        const { error } = await supabaseClient
            .from('engine_logs')
            .insert([payload]);
        
        if (error) {
            Swal.fire('บันทึกล้มเหลว', error.message, 'error');
        } else {
            Swal.fire('สำเร็จ', 'บันทึกข้อมูลเครื่องยนต์เรียบร้อย', 'success');
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
            const { error } = await supabaseClient.from('engine_logs').delete().eq('engine_id', id);
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
