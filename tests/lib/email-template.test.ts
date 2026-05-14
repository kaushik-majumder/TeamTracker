/**
 * Tests for the HTML email templates in lib/email.ts.
 * We only verify the rendered subject + key strings — not exact HTML.
 */
import { describe, it, expect } from 'vitest'
import { workflowSubmittedEmail, workflowReviewedEmail, inviteEmail } from '@/lib/email'

describe('workflowSubmittedEmail', () => {
  it('builds subject with employee name and workflow type', () => {
    const out = workflowSubmittedEmail({
      recipientName: 'Alex Manager',
      recommenderName: 'Sam Lead',
      employeeName: 'Jordan Chen',
      workflowType: 'Promotion',
      detail: 'Junior → Senior',
      justification: 'Crushed it last quarter',
    })
    expect(out.subject).toContain('Promotion')
    expect(out.subject).toContain('Jordan Chen')
    expect(out.html).toContain('Sam Lead')
    expect(out.html).toContain('Crushed it last quarter')
  })

  it('omits the action button when no appUrl provided', () => {
    const out = workflowSubmittedEmail({
      recipientName: 'A',
      recommenderName: 'B',
      employeeName: 'C',
      workflowType: 'Salary Hike',
      detail: '$80k → $90k',
      justification: 'Reason',
    })
    expect(out.html).not.toContain('Review request')
  })
})

describe('workflowReviewedEmail', () => {
  it('uses green color and Approved label for APPROVED decisions', () => {
    const out = workflowReviewedEmail({
      recipientName: 'Sam Lead',
      reviewerName: 'Alex Manager',
      employeeName: 'Jordan',
      workflowType: 'Promotion',
      decision: 'APPROVED',
      detail: 'Junior → Senior',
    })
    expect(out.html).toContain('Approved')
    expect(out.html).toContain('#059669')
  })

  it('uses red color and Rejected label for REJECTED decisions', () => {
    const out = workflowReviewedEmail({
      recipientName: 'Sam Lead',
      reviewerName: 'Alex Manager',
      employeeName: 'Jordan',
      workflowType: 'Salary Hike',
      decision: 'REJECTED',
      detail: '$80k → $120k',
    })
    expect(out.html).toContain('Rejected')
    expect(out.html).toContain('#dc2626')
  })

  it('includes review note when provided', () => {
    const out = workflowReviewedEmail({
      recipientName: 'A',
      reviewerName: 'B',
      employeeName: 'C',
      workflowType: 'Promotion',
      decision: 'APPROVED',
      detail: 'x',
      reviewNote: 'Well deserved!',
    })
    expect(out.html).toContain('Well deserved!')
  })
})

describe('inviteEmail', () => {
  it('contains the setup URL prominently', () => {
    const url = 'https://example.com/setup-password?token=abc'
    const out = inviteEmail({ recipientName: 'New User', setupUrl: url })
    expect(out.html).toContain(url)
    expect(out.subject).toMatch(/set your password/i)
  })

  it('defaults inviterName to "An admin"', () => {
    const out = inviteEmail({ recipientName: 'Bob', setupUrl: 'https://x' })
    expect(out.html).toContain('An admin')
  })
})
