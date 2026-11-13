import { Router } from 'express'
import { asyncHandler } from '../../common/asyncHandler'
import { sendSuccess } from '../../common/apiResponse'
import { requireAuth } from '../../middleware/auth'
import * as dashboardService from './dashboard.service'

export const dashboardRouter = Router()

dashboardRouter.use(requireAuth)

dashboardRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    sendSuccess(res, dashboardService.getDashboard())
  }),
)

dashboardRouter.get(
  '/search',
  asyncHandler(async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q : ''
    sendSuccess(res, dashboardService.searchDashboard(query))
  }),
)

dashboardRouter.get(
  '/instruments/:id',
  asyncHandler(async (req, res) => {
    sendSuccess(res, dashboardService.getInstrument(String(req.params.id)))
  }),
)
