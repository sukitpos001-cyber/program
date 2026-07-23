let editLogId = null;
let currentLogData = []; 

// 1. โหลดรายชื่อพนักงานมาสร้างเป็น Checkbox
async function loadEmployees() {
    const { data, error } = await supabaseClient
        .from('employees')
        .select('name')
        .order('name', { ascending: true });

    const container = document.getElementById('empCheckboxContainer');
    if (error) {
        container.innerHTML = '<span class="text-red-500 text-sm">โหลดข้อมูลไม่สำเร็จ</span>';
        return;
    }

    container.innerHTML = ''; 
    data.forEach(emp => {
        // สร้าง Checkbox สำหรับพนักงานแต่ละคน
        container.innerHTML += `
        <label class="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-1 rounded">
            <input type="checkbox" value="${emp.name}" class="emp-checkbox w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500">
            <span class="text-gray-700">${emp.name}</span>
        </label>`;
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
        const empName = (item.employees && item.employees.length > 0) ? item.employees.join(', ') : '-';
        
        tbody.innerHTML += `
        <tr class="hover:bg-gray-100 transition duration-150 border-b">
            <td class="p-3">${dateObj}</td>
            <td class="p-3">${item.e1_kwh !== null ? item.e1_kwh : '-'}</td>
            <td class="p-3">${item.e1_h !== null ? item.e1_h : '-'}</td>
            <td class="p-3">${item.e2_kwh !== null ? item.e2_kwh : '-'}</td>
            <td class="p-3">${item.e2_h !== null ? item.e2_h : '-'}</td>
            <td class="p-3">${empName}</td>
            <td class="p-3">${item.note || '-'}</td>
            <td class="p-3 text-center">
                <button onclick="prepareEdit('${item.engine_id}')" 
                        class="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 mr-1 mb-1">
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

    // ล้าง Checkbox เก่าออกก่อน
    const checkboxes = document.querySelectorAll('.emp-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
    
    // ติ๊กถูกที่รายชื่อพนักงานที่เคยบันทึกไว้
    if (item.employees && item.employees.length > 0) {
        checkboxes.forEach(cb => {
            if (item.employees.includes(cb.value)) {
                cb.checked = true;
            }
        });
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
    
    // เอาติ๊กถูกออกทั้งหมด
    const checkboxes = document.querySelectorAll('.emp-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
    
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
    
    // ค้นหา Checkbox ที่ถูกติ๊กเลือก และดึงค่า value (ชื่อ) ออกมา
    const checkedBoxes = document.querySelectorAll('.emp-checkbox:checked');
    const selectedEmployees = Array.from(checkedBoxes).map(cb => cb.value);
    
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
        employees: selectedEmployees, // ส่ง Array ของชื่อเข้าไป
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
