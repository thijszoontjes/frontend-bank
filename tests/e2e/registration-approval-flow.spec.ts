import { expect, test, type Page } from '@playwright/test'

const employee = {
  email: 'employee@bank.local',
  password: 'Employee123!',
}

const existingApproved = {
  email: 'approved@bank.local',
  password: 'Approved123!',
}

const existingBlocked = {
  email: 'blocked@bank.local',
  password: 'Blocked123!',
}

function uniqueCustomer(prefix: string) {
  const timestamp = Date.now().toString()
  const suffix = timestamp.slice(-9)

  return {
    firstName: 'UI Flow',
    lastName: `${prefix} User`,
    email: `testuser+${prefix.toLowerCase()}-${timestamp}@example.com`,
    phoneNumber: `+316${timestamp.slice(-8)}`,
    bsn: suffix.padStart(9, '0'),
    password: 'UiFlow123!',
  }
}

async function registerCustomer(page: Page, customer: ReturnType<typeof uniqueCustomer>) {
  await page.goto('/register')
  await page.getByLabel('First name').fill(customer.firstName)
  await page.getByLabel('Last name').fill(customer.lastName)
  await page.getByLabel('Email', { exact: true }).fill(customer.email)
  await page.getByLabel('Phone number', { exact: true }).fill(customer.phoneNumber)
  await page.getByPlaceholder('123456789').fill(customer.bsn)
  await page.getByLabel('Password', { exact: true }).fill(customer.password)
  await page.getByLabel('Repeat password').fill(customer.password)
  await page.getByRole('button', { name: 'Register' }).click()
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByText('Registration completed.')).toBeVisible()
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

async function logout(page: Page) {
  const workspaceLogout = page.getByRole('button', { name: 'Logout' })
  if ((await workspaceLogout.count()) > 0) {
    await workspaceLogout.click()
  } else {
    await page.getByRole('button', { name: 'Log out' }).click()
  }
  await expect(page).toHaveURL(/\/login/)
}

async function loginEmployee(page: Page) {
  await login(page, employee.email, employee.password)
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByText('Employee workspace')).toBeVisible()
}

async function openPendingApproval(page: Page, email: string) {
  await page.goto('/approvals')
  await expect(page.locator('h1', { hasText: 'Approvals' })).toBeVisible()

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const pendingCard = page.locator('.card', { hasText: 'Pending customers' })
    if (await pendingCard.getByText(email).isVisible().catch(() => false)) {
      await pendingCard.locator('.helper-item', { hasText: email }).getByRole('button', { name: 'Open' }).click()
      await expect(page.locator('.card', { hasText: 'Details' }).getByText(email)).toBeVisible()
      return
    }

    const nextButton = pendingCard.getByRole('button', { name: 'Next' })
    if (!(await nextButton.isEnabled())) {
      break
    }
    await nextButton.click()
    await page.waitForTimeout(300)
  }

  throw new Error(`Pending approval for ${email} was not visible in the UI`)
}

async function approveCustomer(page: Page, email: string) {
  await openPendingApproval(page, email)
  await page.getByRole('button', { name: 'Approve' }).click()
  await expect(page.getByText('Customer approved.')).toBeVisible()
  await expect(page.locator('.helper-item', { hasText: email })).toHaveCount(0)
  await expect(page.locator('.card', { hasText: 'Details' }).getByText('approved', { exact: true })).toBeVisible()
}

async function rejectCustomer(page: Page, email: string) {
  await openPendingApproval(page, email)
  await page.getByRole('button', { name: 'Reject' }).click()
  await expect(page.getByText('Registration rejected.')).toBeVisible()
  await expect(page.locator('.helper-item', { hasText: email })).toHaveCount(0)
  await expect(page.locator('.card', { hasText: 'Details' }).getByText('rejected', { exact: true })).toBeVisible()
}

async function openUserByEmail(page: Page, email: string) {
  await page.goto('/users')
  await expect(page.locator('h1', { hasText: 'Users' })).toBeVisible()

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const userRow = page.locator('tr', { hasText: email })
    if ((await userRow.count()) > 0 && await userRow.isVisible().catch(() => false)) {
      await userRow.getByRole('button', { name: 'Edit' }).click()
      await expect(page.getByRole('dialog')).toContainText(email)
      return
    }

    const nextButton = page.getByRole('button', { name: 'Next' })
    if (!(await nextButton.isEnabled())) {
      break
    }
    await nextButton.click()
    await page.waitForTimeout(300)
  }

  throw new Error(`User ${email} was not visible in the UI`)
}

async function closeUserDetail(page: Page) {
  await page.getByRole('button', { name: 'Close user details' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
}

test.describe('registration and approval flow', () => {
  test('approves a new customer and allows customer login without employee features', async ({ page }) => {
    const customer = uniqueCustomer('Approved')

    await registerCustomer(page, customer)

    await login(page, customer.email, customer.password)
    await expect(page).toHaveURL(/\/pending/)
    await expect(page.getByText('Application pending')).toBeVisible()
    await expect(page.getByText(customer.email)).toBeVisible()
    await logout(page)

    await loginEmployee(page)
    await approveCustomer(page, customer.email)
    await logout(page)

    await login(page, customer.email, customer.password)
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText('Customer workspace')).toBeVisible()
    await expect(page.getByRole('link', { name: 'AC Accounts' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'AP Approvals' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'US Users' })).toHaveCount(0)
  })

  test('rejects a new customer and denies subsequent login', async ({ page }) => {
    const customer = uniqueCustomer('Rejected')

    await registerCustomer(page, customer)
    await loginEmployee(page)
    await rejectCustomer(page, customer.email)
    await logout(page)

    await login(page, customer.email, customer.password)
    await expect(page.getByText('This registration was rejected by an employee')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('blocks and unblocks an approved customer through the employee UI', async ({ page }) => {
    await loginEmployee(page)
    await openUserByEmail(page, existingApproved.email)

    if (await page.getByRole('button', { name: 'Unblock' }).isVisible().catch(() => false)) {
      page.once('dialog', (dialog) => dialog.accept())
      await page.getByRole('button', { name: 'Unblock' }).click()
      await expect(page.getByText('User unblocked.')).toBeVisible()
    }

    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Block' }).click()
    await expect(page.getByText('User blocked.')).toBeVisible()
    await expect(page.getByRole('dialog')).toContainText('Blocked')
    await closeUserDetail(page)
    await logout(page)

    await login(page, existingApproved.email, existingApproved.password)
    await expect(page.getByText('This user account is blocked')).toBeVisible()

    await loginEmployee(page)
    await openUserByEmail(page, existingApproved.email)
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Unblock' }).click()
    await expect(page.getByText('User unblocked.')).toBeVisible()
    await expect(page.getByRole('dialog')).toContainText('Approved')
    await closeUserDetail(page)
    await logout(page)

    await login(page, existingApproved.email, existingApproved.password)
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText('Customer workspace')).toBeVisible()
  })
})

test.describe('auth validation edge cases', () => {
  test('shows registration and login validation errors', async ({ page }) => {
    const customer = uniqueCustomer('Validation')

    await page.goto('/register')
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page.getByText('firstName: must not be blank')).toBeVisible()

    await page.getByLabel('First name').fill(customer.firstName)
    await page.getByLabel('Last name').fill(customer.lastName)
    await page.getByLabel('Email', { exact: true }).fill('not-an-email')
    await page.getByLabel('Phone number', { exact: true }).fill(customer.phoneNumber)
    await page.getByPlaceholder('123456789').fill(customer.bsn)
    await page.getByLabel('Password', { exact: true }).fill(customer.password)
    await page.getByLabel('Repeat password').fill(customer.password)
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page.getByText('email: must be a well-formed email address')).toBeVisible()

    await page.getByLabel('Email', { exact: true }).fill(customer.email)
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page).toHaveURL(/\/login/)
    await page.goto('/register')
    await page.getByLabel('First name').fill(customer.firstName)
    await page.getByLabel('Last name').fill(customer.lastName)
    await page.getByLabel('Email', { exact: true }).fill(customer.email)
    await page.getByLabel('Phone number', { exact: true }).fill(customer.phoneNumber)
    await page.getByPlaceholder('123456789').fill(`${Number(customer.bsn) + 1}`.padStart(9, '0').slice(-9))
    await page.getByLabel('Password', { exact: true }).fill(customer.password)
    await page.getByLabel('Repeat password').fill(customer.password)
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page.getByText('Email address is already registered')).toBeVisible()

    await login(page, customer.email, 'WrongPassword123!')
    await expect(page.getByText('Invalid email or password')).toBeVisible()

    await login(page, customer.email, customer.password)
    await expect(page).toHaveURL(/\/pending/)
    await expect(page.getByText('Application pending')).toBeVisible()

    await logout(page)
    await login(page, existingBlocked.email, existingBlocked.password)
    await expect(page.getByText('This user account is blocked')).toBeVisible()
  })
})
